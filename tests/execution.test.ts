import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listLevelTests, runLevelTests } from "@/lib/execution/runner";
import type { LevelPackage } from "@/lib/assessments/types";
import { createTempDir } from "./fixtures";

function makeLevel(
  files: { public?: string; hidden?: string },
  timeoutMs = 3000
): LevelPackage {
  const levelDir = createTempDir("assessment-level-");
  const publicTestsPath = path.join(levelDir, "tests.public.js");
  const hiddenTestsPath = path.join(levelDir, "tests.hidden.js");
  fs.writeFileSync(publicTestsPath, files.public ?? "module.exports = [];");
  fs.writeFileSync(hiddenTestsPath, files.hidden ?? "module.exports = [];");

  return {
    number: 1,
    title: "Test level",
    difficulty: "easy",
    timeoutMs,
    description: "# Test level",
    workspace: { entry: "solution.js", files: [{ path: "solution.js", editable: true }] },
    templateFiles: { "solution.js": "module.exports = {};\n" },
    solutionFiles: { "solution.js": "module.exports = {};\n" },
    publicTestsPath,
    hiddenTestsPath,
    dir: levelDir,
  };
}

const EMPTY = { "solution.js": "module.exports = {};\n" };

const PASSING_TESTS = `module.exports = [
  { id: "p1", name: "First", run(t) { t.eq(1 + 1, 2); } },
  { id: "p2", name: "Second", run(t) { t.eq([1, 2], [1, 2]); } },
];
`;

describe("execution runner", () => {
  it("passes a correct solution", async () => {
    const level = makeLevel({ public: PASSING_TESTS });
    const outcome = await runLevelTests({ level, files: EMPTY, suites: ["public"] });

    expect(outcome.status).toBe("passed");
    expect(outcome.passedTests).toBe(2);
    expect(outcome.totalTests).toBe(2);
    expect(outcome.tests.every((test) => test.status === "passed")).toBe(true);
  });

  it("fails with expected and received details", async () => {
    const level = makeLevel({
      public: `module.exports = [
  { id: "p1", name: "Mismatch", run(t) { t.eq(8, 10); } },
];
`,
    });
    const outcome = await runLevelTests({ level, files: EMPTY, suites: ["public"] });

    expect(outcome.status).toBe("failed");
    expect(outcome.tests[0].status).toBe("failed");
    expect(outcome.tests[0].message).toContain("Expected: 10");
    expect(outcome.tests[0].message).toContain("Received: 8");
  });

  it("reports runtime errors", async () => {
    const level = makeLevel({
      public: `module.exports = [
  { id: "p1", name: "Throws", run() { throw new Error("boom"); } },
];
`,
    });
    const outcome = await runLevelTests({ level, files: EMPTY, suites: ["public"] });

    expect(outcome.status).toBe("error");
    expect(outcome.tests[0].status).toBe("error");
    expect(outcome.tests[0].message).toContain("boom");
  });

  it("kills infinite loops, marks the running test as timeout and skips the rest", async () => {
    const level = makeLevel(
      {
        public: `module.exports = [
  { id: "p1", name: "Fast", run(t) { t.eq(1, 1); } },
  { id: "p2", name: "Hangs", run() { while (true) {} } },
  { id: "p3", name: "Never runs", run(t) { t.eq(1, 1); } },
];
`,
      },
      1000
    );
    const outcome = await runLevelTests({ level, files: EMPTY, suites: ["public"] });

    expect(outcome.status).toBe("timeout");
    const byId = new Map(outcome.tests.map((test) => [test.id, test.status]));
    expect(byId.get("p1")).toBe("passed");
    expect(byId.get("p2")).toBe("timeout");
    expect(byId.get("p3")).toBe("skipped");
    expect(outcome.message).toContain("timed out");
  });

  it("only runs hidden tests when requested", async () => {
    const level = makeLevel({
      public: PASSING_TESTS,
      hidden: `module.exports = [
  { id: "h1", name: "Hidden fail", run(t) { t.eq(1, 2); } },
];
`,
    });

    const publicOnly = await runLevelTests({ level, files: EMPTY, suites: ["public"] });
    expect(publicOnly.status).toBe("passed");
    expect(publicOnly.tests).toHaveLength(2);

    const withHidden = await runLevelTests({
      level,
      files: EMPTY,
      suites: ["public", "hidden"],
    });
    expect(withHidden.status).toBe("failed");
    expect(withHidden.tests).toHaveLength(3);
    expect(withHidden.tests.find((test) => test.id === "h1")?.visibility).toBe("hidden");
  });

  it("lists public and hidden test metadata without executing them", async () => {
    const level = makeLevel({
      public: PASSING_TESTS,
      hidden: `module.exports = [
  { id: "h1", name: "Hidden one", run(t) { t.eq(1, 1); } },
];
`,
    });

    const result = await listLevelTests(level);

    expect(result.error).toBeUndefined();
    expect(result.tests).toEqual([
      { id: "p1", name: "First", visibility: "public" },
      { id: "p2", name: "Second", visibility: "public" },
      { id: "h1", name: "Hidden one", visibility: "hidden" },
    ]);
  });

  it("supports async tests", async () => {
    const level = makeLevel({
      public: `module.exports = [
  { id: "p1", name: "Async", async run(t) { await Promise.resolve(); t.eq(2, 2); } },
];
`,
    });
    const outcome = await runLevelTests({ level, files: EMPTY, suites: ["public"] });
    expect(outcome.status).toBe("passed");
  });

  it("captures console output produced while a test runs", async () => {
    const level = makeLevel({
      public: `module.exports = [
  { id: "p1", name: "Logs", run(t, entry) { console.log("hello", 1, { a: 2 }); t.ok(entry); } },
];
`,
    });
    const outcome = await runLevelTests({
      level,
      files: { "solution.js": "module.exports = {};" },
      suites: ["public"],
    });
    expect(outcome.status).toBe("passed");
    expect(outcome.tests[0].logs).toBeDefined();
    expect((outcome.tests[0].logs ?? []).join("\n")).toContain("hello 1 { a: 2 }");
  });

  it("captures logs even when a test fails", async () => {
    const level = makeLevel({
      public: `module.exports = [
  { id: "p1", name: "Logs then fails", run(t) { console.error("boom log"); t.eq(1, 2); } },
];
`,
    });
    const outcome = await runLevelTests({ level, files: EMPTY, suites: ["public"] });
    expect(outcome.tests[0].status).toBe("failed");
    expect((outcome.tests[0].logs ?? []).join("\n")).toContain("[error] boom log");
  });

  it("isolates module state between tests", async () => {
    const level = makeLevel({
      public: `module.exports = [
  { id: "p1", name: "First", run(t, entry) { t.eq(entry.inc(), 1); } },
  { id: "p2", name: "Second", run(t, entry) { t.eq(entry.inc(), 1); } },
];
`,
    });
    const outcome = await runLevelTests({
      level,
      files: { "solution.js": "let count = 0; module.exports = { inc: () => ++count };" },
      suites: ["public"],
    });
    expect(outcome.status).toBe("passed");
  });

  it("writes locked files from the template and editable files from the candidate", async () => {
    const levelDir = createTempDir("assessment-multi-");
    fs.writeFileSync(path.join(levelDir, "tests.public.js"), `module.exports = [
  { id: "p1", name: "Uses helper", run(t, entry) { t.eq(entry.answer(), 42); } },
];
`);
    fs.writeFileSync(path.join(levelDir, "tests.hidden.js"), "module.exports = [];");

    const level: LevelPackage = {
      number: 1,
      title: "Multi",
      difficulty: "easy",
      timeoutMs: 3000,
      description: "",
      workspace: {
        entry: "src/main.js",
        files: [
          { path: "src/helper.js", editable: false },
          { path: "src/main.js", editable: true },
        ],
      },
      templateFiles: {
        "src/helper.js": "module.exports = { value: 42 };\n",
        "src/main.js": "// TODO\n",
      },
      solutionFiles: {
        "src/main.js": 'module.exports = { answer: () => require("./helper").value };\n',
      },
      publicTestsPath: path.join(levelDir, "tests.public.js"),
      hiddenTestsPath: path.join(levelDir, "tests.hidden.js"),
      dir: levelDir,
    };

    const outcome = await runLevelTests({ level, files: level.solutionFiles, suites: ["public"] });
    expect(outcome.status).toBe("passed");
  });
});
