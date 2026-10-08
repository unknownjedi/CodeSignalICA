import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  LevelPackage,
  TestDefinitionMeta,
  TestVisibility,
} from "../assessments/types";
import type { FileMap } from "../assessments/repository";

export type TestStatus = "passed" | "failed" | "error" | "timeout" | "skipped";
export type RunStatus = "passed" | "failed" | "error" | "timeout";

export interface TestOutcome {
  id: string;
  name: string;
  visibility: TestVisibility;
  status: TestStatus;
  durationMs: number;
  message?: string;
  /** console output captured while the test ran (public tests only are exposed). */
  logs?: string[];
}

export interface RunOutcome {
  status: RunStatus;
  tests: TestOutcome[];
  passedTests: number;
  totalTests: number;
  durationMs: number;
  message?: string;
  stderr?: string;
}

export interface RunOptions {
  level: LevelPackage;
  files: FileMap;
  suites: TestVisibility[];
  timeoutMs?: number;
  memoryMb?: number;
}

const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const DEFAULT_MEMORY_MB = 256;
const LIST_TIMEOUT_MS = 15_000;

function harnessPath(): string {
  return path.join(process.cwd(), "runner", "harness.js");
}

/**
 * Execution workspaces live in the OS temp directory, never inside the project,
 * so the dev server's file watcher does not reload the app on every test run.
 */
function tmpRoot(): string {
  return path.join(os.tmpdir(), "industry-coding-assessments", "tmp");
}

async function createExecutionDir(): Promise<string> {
  await fsp.mkdir(tmpRoot(), { recursive: true });
  return fsp.mkdtemp(path.join(tmpRoot(), "run-"));
}

/**
 * Writes the level's workspace into a fresh directory:
 * - locked files come from the level template
 * - editable files come from the candidate's map (falling back to the template)
 */
export async function prepareExecutionDir(
  level: LevelPackage,
  files: FileMap,
  suites: TestVisibility[]
): Promise<string> {
  const dir = await createExecutionDir();
  await fsp.copyFile(harnessPath(), path.join(dir, "harness.js"));

  for (const ref of level.workspace.files) {
    if (!isSafeRelative(ref.path)) {
      throw new Error(`Unsafe workspace path: ${ref.path}`);
    }
    const provided = ref.editable ? files[ref.path] : undefined;
    const content = provided !== undefined ? provided : level.templateFiles[ref.path] ?? "";
    const target = path.join(dir, ref.path);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, content, "utf8");
  }

  for (const suite of suites) {
    const source = suite === "public" ? level.publicTestsPath : level.hiddenTestsPath;
    await fsp.copyFile(source, path.join(dir, `tests.${suite}.js`));
  }

  return dir;
}

function isSafeRelative(candidate: string): boolean {
  if (!candidate || path.isAbsolute(candidate)) return false;
  const normalized = path.normalize(candidate);
  return !normalized.startsWith("..") && !normalized.split(path.sep).includes("..");
}

interface HarnessEvents {
  plan: TestDefinitionMeta[];
  started: string[];
  completed: Map<string, TestOutcome>;
  result?: {
    status: RunStatus;
    tests: TestOutcome[];
    durationMs: number;
    message?: string;
  };
  list?: TestDefinitionMeta[];
  listError?: string;
}

function createLineParser(onLine: (line: string) => void) {
  let buffer = "";
  return (chunk: string) => {
    buffer += chunk;
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
      buffer = buffer.slice(newlineIndex + 1);
      onLine(line);
      newlineIndex = buffer.indexOf("\n");
    }
  };
}

function isTestMeta(value: unknown): value is TestDefinitionMeta {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as TestDefinitionMeta).id === "string" &&
    typeof (value as TestDefinitionMeta).name === "string" &&
    ((value as TestDefinitionMeta).visibility === "public" ||
      (value as TestDefinitionMeta).visibility === "hidden")
  );
}

/**
 * Parses harness protocol lines. Anything malformed is ignored rather than
 * trusted, so that stray candidate output can never crash the parent process.
 */
function parseEvents(line: string, events: HarnessEvents) {
  if (!line.startsWith("@@")) {
    return;
  }
  const spaceIndex = line.indexOf(" ");
  const marker = spaceIndex === -1 ? line.slice(2) : line.slice(2, spaceIndex);
  const payloadText = spaceIndex === -1 ? "" : line.slice(spaceIndex + 1);
  let payload: unknown;
  try {
    payload = payloadText ? JSON.parse(payloadText) : null;
  } catch {
    return;
  }
  switch (marker) {
    case "PLAN":
      if (Array.isArray(payload)) {
        events.plan = payload.filter(isTestMeta);
      }
      break;
    case "TEST_START":
      if (payload && typeof payload === "object" && typeof (payload as { id?: unknown }).id === "string") {
        events.started.push((payload as { id: string }).id);
      }
      break;
    case "TEST_END":
      if (payload && typeof payload === "object" && typeof (payload as { id?: unknown }).id === "string") {
        const outcome = payload as TestOutcome;
        if (Array.isArray(outcome.logs)) {
          outcome.logs = outcome.logs
            .filter((line): line is string => typeof line === "string")
            .slice(0, 500);
        } else {
          delete outcome.logs;
        }
        events.completed.set(outcome.id, outcome);
      }
      break;
    case "RESULT":
      if (
        payload &&
        typeof payload === "object" &&
        typeof (payload as { status?: unknown }).status === "string" &&
        Array.isArray((payload as { tests?: unknown }).tests)
      ) {
        events.result = payload as HarnessEvents["result"];
      }
      break;
    case "LIST":
      if (Array.isArray(payload)) {
        events.list = payload.filter(isTestMeta);
      }
      break;
    case "LIST_ERROR":
      events.listError = JSON.stringify(payload);
      break;
  }
}

interface ChildOutcome {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  outputExceeded: boolean;
  spawnError?: Error;
  stdout: string;
  stderr: string;
  durationMs: number;
  events: HarnessEvents;
}

function runChild(
  dir: string,
  args: string[],
  timeoutMs: number,
  memoryMb: number
): Promise<ChildOutcome> {
  return new Promise((resolve) => {
    const started = process.hrtime.bigint();
    const events: HarnessEvents = { plan: [], started: [], completed: new Map() };
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let outputExceeded = false;
    let settled = false;

    const child = spawn(
      process.execPath,
      [`--max-old-space-size=${memoryMb}`, path.join(dir, "harness.js"), ...args],
      { cwd: dir, stdio: ["ignore", "pipe", "pipe"] }
    );

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    const stdoutParser = createLineParser((line) => parseEvents(line, events));
    const stderrParser = createLineParser(() => {});

    const enforceOutputLimit = () => {
      if (stdout.length + stderr.length > MAX_OUTPUT_BYTES && !outputExceeded) {
        outputExceeded = true;
        child.kill("SIGKILL");
      }
    };

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      enforceOutputLimit();
      stdoutParser(chunk);
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      enforceOutputLimit();
      stderrParser(chunk);
    });

    const finish = (extra: Partial<ChildOutcome>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        exitCode: null,
        signal: null,
        timedOut,
        outputExceeded,
        stdout,
        stderr,
        durationMs: Number(process.hrtime.bigint() - started) / 1e6,
        events,
        ...extra,
      });
    };

    child.on("error", (error) => finish({ spawnError: error }));
    child.on("close", (exitCode, signal) => finish({ exitCode, signal }));
  });
}

function reconstructOnTimeout(events: HarnessEvents): TestOutcome[] {
  const outcomes: TestOutcome[] = [];
  const inFlight = new Set(events.started);
  const planned = new Set(events.plan.map((test) => test.id));

  for (const test of events.plan) {
    const completed = events.completed.get(test.id);
    if (completed) {
      outcomes.push(completed);
      inFlight.delete(test.id);
      continue;
    }
    if (inFlight.has(test.id)) {
      outcomes.push({
        id: test.id,
        name: test.name,
        visibility: test.visibility,
        status: "timeout",
        durationMs: 0,
      });
      inFlight.delete(test.id);
      continue;
    }
    outcomes.push({
      id: test.id,
      name: test.name,
      visibility: test.visibility,
      status: "skipped",
      durationMs: 0,
    });
  }

  // Tests that started but were never in the plan (e.g. the harness crashed
  // before emitting PLAN): report them as timeouts rather than dropping them.
  for (const id of inFlight) {
    if (planned.has(id)) continue;
    outcomes.push({ id, name: id, visibility: "public", status: "timeout", durationMs: 0 });
  }

  return outcomes;
}

function summarize(status: RunStatus, tests: TestOutcome[], durationMs: number): RunOutcome {
  const passedTests = tests.filter((test) => test.status === "passed").length;
  return {
    status,
    tests,
    passedTests,
    totalTests: tests.length,
    durationMs: Math.round(durationMs * 1000) / 1000,
  };
}

export async function runLevelTests(options: RunOptions): Promise<RunOutcome> {
  const { level, files, suites } = options;
  const timeoutMs = options.timeoutMs ?? level.timeoutMs;
  const memoryMb = options.memoryMb ?? DEFAULT_MEMORY_MB;

  const dir = await prepareExecutionDir(level, files, suites);
  try {
    const child = await runChild(
      dir,
      [suites.join(","), level.workspace.entry],
      timeoutMs,
      memoryMb
    );

    if (child.spawnError) {
      return {
        ...summarize("error", [], child.durationMs),
        message: "Unable to start the execution process.",
        stderr: child.spawnError.message,
      };
    }

    if (child.outputExceeded) {
      return {
        ...summarize("error", reconstructOnTimeout(child.events), child.durationMs),
        message: "Execution produced too much output and was terminated.",
        stderr: child.stderr,
      };
    }

    if (child.timedOut) {
      return {
        ...summarize("timeout", reconstructOnTimeout(child.events), child.durationMs),
        message: `Execution timed out after ${timeoutMs} ms.`,
        stderr: child.stderr,
      };
    }

    if (child.events.result) {
      const { tests, durationMs } = child.events.result;
      return {
        ...summarize(child.events.result.status, tests, durationMs),
        message: child.events.result.message,
        stderr: child.stderr,
      };
    }

    return {
      ...summarize("error", reconstructOnTimeout(child.events), child.durationMs),
      message: "The test runner exited unexpectedly.",
      stderr: child.stderr || child.stdout,
    };
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export interface ListTestsResult {
  tests: TestDefinitionMeta[];
  error?: string;
}

export async function listLevelTests(level: LevelPackage): Promise<ListTestsResult> {
  const dir = await prepareExecutionDir(level, {}, ["public", "hidden"]);
  try {
    const child = await runChild(
      dir,
      ["--list", level.workspace.entry],
      LIST_TIMEOUT_MS,
      DEFAULT_MEMORY_MB
    );
    if (child.events.list) {
      return { tests: child.events.list };
    }
    return {
      tests: [],
      error: child.events.listError ?? "Unable to load test definitions.",
    };
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function cleanTmpDirs(): Promise<void> {
  await fsp.rm(tmpRoot(), { recursive: true, force: true }).catch(() => {});
}
