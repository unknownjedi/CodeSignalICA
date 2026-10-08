"use strict";

/**
 * Test harness executed inside a dedicated Node.js child process.
 *
 * Usage:
 *   node harness.js public,hidden src/working-hours.js   # run tests
 *   node harness.js --list src/working-hours.js          # emit test metadata only
 *
 * The second argument is the workspace entry module (relative to the workspace
 * root) that is passed to each test as the second `run` argument.
 *
 * Test files export an array of:
 *   { id: string, name: string, run: (t, entry) => void | Promise<void> }
 *
 * Assertion API (deliberately small):
 *   t.eq(actual, expected, label?)
 *   t.ok(value, label?)
 *   t.throws(fn, label?)
 *   t.fail(message)
 *
 * Output protocol (one JSON object per line):
 *   @@PLAN       [{"id","name","visibility"}]
 *   @@TEST_START {"id": "..."}
 *   @@TEST_END   {"id", "name", "visibility", "status", "durationMs", "message"}
 *   @@RESULT     {"status", "tests": [...], "durationMs"}
 *   @@LIST       [{"id", "name", "visibility"}]
 */

const fs = require("node:fs");
const path = require("node:path");
const { inspect } = require("node:util");

const SUITE_FILES = {
  public: "tests.public.js",
  hidden: "tests.hidden.js",
};

const MAX_LOG_LINES = 200;
const MAX_LOG_CHARS = 20000;

let capturedLogs = null;
let capturedChars = 0;

function formatLogArg(value) {
  if (typeof value === "string") return value;
  try {
    return inspect(value, { depth: 4, breakLength: 120, maxArrayLength: 100 });
  } catch {
    return String(value);
  }
}

// Capture console output produced by the candidate implementation so it can be
// shown alongside test results. Output is captured per test and never written to
// stdout, which keeps the protocol channel clean.
for (const level of ["log", "info", "warn", "error", "debug"]) {
  const label = level === "log" || level === "info" ? "" : `[${level}] `;
  console[level] = (...args) => {
    if (!capturedLogs) return;
    if (capturedLogs.length >= MAX_LOG_LINES || capturedChars >= MAX_LOG_CHARS) return;
    const line = label + args.map(formatLogArg).join(" ");
    capturedLogs.push(line);
    capturedChars += line.length;
  };
}

function beginLogCapture() {
  capturedLogs = [];
  capturedChars = 0;
}

function endLogCapture() {
  const logs = capturedLogs ?? [];
  capturedLogs = null;
  return logs;
}

function emit(marker, payload) {
  process.stdout.write(`@@${marker} ${JSON.stringify(payload)}\n`);
}

function stringify(value) {
  try {
    const json = JSON.stringify(value, (_key, inner) => {
      if (typeof inner === "undefined") return "<undefined>";
      if (typeof inner === "number" && !Number.isFinite(inner)) return `<${String(inner)}>`;
      if (typeof inner === "bigint") return `${inner}n`;
      if (typeof inner === "function") return `<function ${inner.name || "anonymous"}>`;
      return inner;
    });
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number" && Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

function makeAssertions() {
  const failures = [];

  return {
    eq(actual, expected, label) {
      if (!deepEqual(actual, expected)) {
        const prefix = label ? `${label}\n` : "";
        failures.push(
          `${prefix}Expected: ${stringify(expected)}\nReceived: ${stringify(actual)}`
        );
      }
    },
    ok(value, label) {
      if (!value) {
        failures.push(label ? `Expected truthy value: ${label}` : "Expected a truthy value");
      }
    },
    throws(fn, label) {
      let threw = false;
      try {
        fn();
      } catch {
        threw = true;
      }
      if (!threw) {
        failures.push(label ? `Expected function to throw: ${label}` : "Expected function to throw");
      }
    },
    fail(message) {
      failures.push(message || "Test failed");
    },
    get failures() {
      return failures;
    },
  };
}

function errorMessage(error) {
  if (error && typeof error === "object") {
    const name = error.name || "Error";
    const message = error.message || String(error);
    return `${name}: ${message}`;
  }
  return `Error: ${String(error)}`;
}

function walkJsFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(full);
      }
    }
  }
  return files;
}

function clearWorkspaceCache() {
  for (const file of walkJsFiles(__dirname)) {
    delete require.cache[file];
  }
}

function freshRequire(file) {
  delete require.cache[file];
  return require(file);
}

function loadSuites(suites) {
  const definitions = [];
  const loadErrors = [];

  for (const visibility of suites) {
    const file = path.join(__dirname, SUITE_FILES[visibility]);
    if (!fs.existsSync(file)) continue;
    try {
      const suite = require(file);
      if (!Array.isArray(suite)) {
        throw new Error(`test suite must export an array (${SUITE_FILES[visibility]})`);
      }
      for (const test of suite) {
        if (!test || typeof test.id !== "string" || typeof test.run !== "function") {
          throw new Error(
            `invalid test definition in ${SUITE_FILES[visibility]}: every test needs a string id and a run function`
          );
        }
        definitions.push({
          id: test.id,
          name: typeof test.name === "string" ? test.name : test.id,
          visibility,
          file,
        });
      }
    } catch (error) {
      loadErrors.push({ visibility, message: errorMessage(error) });
    }
  }

  const seen = new Set();
  const duplicates = new Set();
  for (const definition of definitions) {
    if (seen.has(definition.id)) {
      duplicates.add(definition.id);
    }
    seen.add(definition.id);
  }
  if (duplicates.size > 0) {
    loadErrors.push({
      visibility: "public",
      message: `duplicate test id(s): ${[...duplicates].sort().join(", ")}`,
    });
    definitions.length = 0;
  }

  return { definitions, loadErrors };
}

async function runTest(definition, entryPath) {
  emit("TEST_START", { id: definition.id });
  const started = process.hrtime.bigint();
  const assertions = makeAssertions();
  beginLogCapture();
  let status = "passed";
  let message = null;

  try {
    clearWorkspaceCache();
    const suite = freshRequire(definition.file);
    const test = suite.find((candidate) => candidate.id === definition.id);
    if (!test) {
      throw new Error(`test "${definition.id}" disappeared between enumeration and execution`);
    }
    const entry = entryPath ? require(entryPath) : undefined;
    const result = test.run(assertions, entry);
    if (result && typeof result.then === "function") {
      await result;
    }
    if (assertions.failures.length > 0) {
      status = "failed";
      message = assertions.failures.join("\n\n");
    }
  } catch (error) {
    status = "error";
    message = errorMessage(error);
  }

  const logs = endLogCapture();
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  const payload = {
    id: definition.id,
    name: definition.name,
    visibility: definition.visibility,
    status,
    durationMs: Math.round(durationMs * 1000) / 1000,
  };
  if (message) payload.message = message;
  if (logs.length > 0) payload.logs = logs;
  emit("TEST_END", payload);
  return payload;
}

function overallStatus(tests) {
  if (tests.length === 0) return "error";
  if (tests.some((test) => test.status === "timeout")) return "timeout";
  if (tests.some((test) => test.status === "error")) return "error";
  if (tests.some((test) => test.status === "failed")) return "failed";
  return "passed";
}

async function main() {
  const arg = process.argv[2] || "public";
  const entryArg = process.argv[3] || "";
  const entryPath = entryArg ? path.join(__dirname, entryArg) : "";

  if (arg === "--list") {
    const { definitions, loadErrors } = loadSuites(["public", "hidden"]);
    if (loadErrors.length > 0) {
      emit("LIST_ERROR", loadErrors);
      return;
    }
    emit(
      "LIST",
      definitions.map(({ id, name, visibility }) => ({ id, name, visibility }))
    );
    return;
  }

  const suites = arg
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value === "public" || value === "hidden");
  const started = process.hrtime.bigint();

  const { definitions, loadErrors } = loadSuites(suites);
  const results = [];

  emit(
    "PLAN",
    definitions.map(({ id, name, visibility }) => ({ id, name, visibility }))
  );

  for (const error of loadErrors) {
    results.push({
      id: `${error.visibility}-load-error`,
      name: `Failed to load ${error.visibility} tests`,
      visibility: error.visibility,
      status: "error",
      durationMs: 0,
      message: error.message,
    });
  }

  for (const definition of definitions) {
    results.push(await runTest(definition, entryPath));
  }

  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  emit("RESULT", {
    status: overallStatus(results),
    tests: results,
    durationMs: Math.round(durationMs * 1000) / 1000,
  });
}

main().catch((error) => {
  emit("RESULT", {
    status: "error",
    tests: [],
    durationMs: 0,
    message: errorMessage(error),
  });
});
