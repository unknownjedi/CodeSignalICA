import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDb, runMigrations } from "@/lib/database/client";
import {
  getActiveSession,
  getLatestAttempt,
  getLatestPassedSubmit,
  getOrSeedFiles,
  getStoredFileMap,
  hashFiles,
  levelId,
  recordAttempt,
  saveFiles,
  setSessionLastLevel,
  startSession,
  syncAssessmentPackages,
} from "@/lib/assessments/repository";
import type { AssessmentPackage, LevelPackage } from "@/lib/assessments/types";
import { createTempDir } from "./fixtures";

const STARTER_1 = `class WorkingHours {
  addEmployee(id, position) {
    // TODO
  }
}

module.exports = WorkingHours;
`;

const STARTER_2 = `class WorkingHours {
  addEmployee(id, position) {
    // TODO
  }

  topNEmployees(n, position) {
    // TODO
  }
}

module.exports = WorkingHours;
`;

function makeLevel(number: number, template: string, solution: string): LevelPackage {
  return {
    number,
    title: `Level ${number}`,
    difficulty: "easy",
    timeoutMs: 5000,
    description: `# Level ${number}`,
    workspace: { entry: "solution.js", files: [{ path: "solution.js", editable: true }] },
    templateFiles: { "solution.js": template },
    solutionFiles: { "solution.js": solution },
    publicTestsPath: "/tmp/fixture/tests.public.js",
    hiddenTestsPath: "/tmp/fixture/tests.hidden.js",
    dir: `/tmp/fixture/levels/level-${number}`,
  };
}

function makePackage(): AssessmentPackage {
  return {
    id: "fixture",
    title: "Fixture",
    description: "Fixture assessment",
    durationMinutes: 30,
    language: "javascript",
    dir: "/tmp/fixture",
    levels: [makeLevel(1, STARTER_1, STARTER_1), makeLevel(2, STARTER_2, STARTER_2)],
  };
}

function makeDb() {
  const db = createDb(path.join(createTempDir(), "test.db"));
  runMigrations(db);
  return db;
}

describe("database and repository", () => {
  it("creates a fresh database and syncs packages, seeding from the template", () => {
    const db = makeDb();
    const pkg = makePackage();
    syncAssessmentPackages(db, [pkg]);

    const seeded = getOrSeedFiles(db, pkg, 1);
    expect(seeded.seeded).toBe(true);
    expect(seeded.files["solution.js"]).toBe(STARTER_1);
  });

  it("seeds a later level from the candidate's previous level code", () => {
    const db = makeDb();
    const pkg = makePackage();
    syncAssessmentPackages(db, [pkg]);

    const candidateCode = `class WorkingHours {
  addEmployee(id, position) {
    this.people = new Map();
  }
}

module.exports = WorkingHours;
`;
    saveFiles(db, pkg.id, 1, { "solution.js": candidateCode });

    const seeded = getOrSeedFiles(db, pkg, 2);
    expect(seeded.seeded).toBe(true);
    expect(seeded.files["solution.js"]).toContain("this.people = new Map();");
    expect(seeded.files["solution.js"]).toContain("topNEmployees(n, position)");
    expect(seeded.files["solution.js"]!.match(/topNEmployees/g)).toHaveLength(1);
    expect(seeded.added).toContain("solution.js:WorkingHours.topNEmployees");
  });

  it("returns existing files without reseeding", () => {
    const db = makeDb();
    const pkg = makePackage();
    syncAssessmentPackages(db, [pkg]);

    getOrSeedFiles(db, pkg, 1);
    saveFiles(db, pkg.id, 1, { "solution.js": "module.exports = 42;\n" });

    const again = getOrSeedFiles(db, pkg, 1);
    expect(again.seeded).toBe(false);
    expect(again.files["solution.js"]).toBe("module.exports = 42;\n");
  });

  it("persists code across database connections", () => {
    const dbPath = path.join(createTempDir(), "persist.db");
    const first = createDb(dbPath);
    runMigrations(first);
    const pkg = makePackage();
    syncAssessmentPackages(first, [pkg]);
    saveFiles(first, pkg.id, 1, { "solution.js": "// persisted code\n" });

    const second = createDb(dbPath);
    const stored = getStoredFileMap(second, pkg.id, pkg.levels[0]);
    expect(stored?.["solution.js"]).toBe("// persisted code\n");
  });

  it("produces stable hashes regardless of key order", () => {
    expect(hashFiles({ "a.js": "x", "b.js": "y" })).toBe(
      hashFiles({ "b.js": "y", "a.js": "x" })
    );
    expect(hashFiles({ "a.js": "x" })).not.toBe(hashFiles({ "a.js": "z" }));
  });

  it("records attempts and test results", () => {
    const db = makeDb();
    const pkg = makePackage();
    syncAssessmentPackages(db, [pkg]);

    recordAttempt(db, {
      assessmentId: pkg.id,
      levelNumber: 1,
      type: "run",
      status: "failed",
      passedTests: 1,
      totalTests: 2,
      durationMs: 12,
      codeHash: "hash-run",
      testResults: [
        { testId: "p1", status: "passed", durationMs: 1 },
        { testId: "p2", status: "failed", durationMs: 2, errorMessage: "Expected: 1" },
      ],
    });
    recordAttempt(db, {
      assessmentId: pkg.id,
      levelNumber: 1,
      type: "submit",
      status: "passed",
      passedTests: 3,
      totalTests: 3,
      durationMs: 20,
      codeHash: "hash-submit",
      testResults: [],
    });

    expect(getLatestAttempt(db, pkg.id, 1, "run")?.status).toBe("failed");
    const passed = getLatestPassedSubmit(db, pkg.id, 1);
    expect(passed?.codeHash).toBe("hash-submit");
    expect(passed?.passedTests).toBe(3);
  });

  it("manages sessions idempotently", () => {
    const db = makeDb();
    const pkg = makePackage();
    syncAssessmentPackages(db, [pkg]);

    const first = startSession(db, pkg.id, "assessment", 90);
    const second = startSession(db, pkg.id, "practice", 30);
    expect(second.id).toBe(first.id);
    expect(second.mode).toBe("assessment");

    setSessionLastLevel(db, first.id, 2);
    const active = getActiveSession(db, pkg.id);
    expect(active?.lastLevelNumber).toBe(2);
  });

  it("keeps candidate code and attempts when metadata is re-synced", () => {
    const db = makeDb();
    const pkg = makePackage();
    syncAssessmentPackages(db, [pkg]);
    saveFiles(db, pkg.id, 1, { "solution.js": "// candidate\n" });
    recordAttempt(db, {
      assessmentId: pkg.id,
      levelNumber: 1,
      type: "submit",
      status: "passed",
      passedTests: 1,
      totalTests: 1,
      durationMs: 5,
      codeHash: "hash",
      testResults: [],
    });

    const updated = {
      ...pkg,
      title: "Renamed",
      levels: pkg.levels.map((level) => ({ ...level, title: "Renamed level" })),
    };
    syncAssessmentPackages(db, [updated]);

    expect(getStoredFileMap(db, pkg.id, pkg.levels[0])?.["solution.js"]).toBe("// candidate\n");
    expect(getLatestPassedSubmit(db, pkg.id, 1)?.status).toBe("passed");
    expect(levelId(pkg.id, 1)).toBe("fixture:1");
  });
});
