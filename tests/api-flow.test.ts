import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { resetReadyForTests, ensureReady } from "@/lib/server/bootstrap";
import { executeLevel } from "@/lib/server/execution-service";
import { getAssessmentSummary, getLevelProgress } from "@/lib/server/queries";
import { saveFiles } from "@/lib/assessments/repository";
import { testResults } from "@/lib/database/schema";
import { eq } from "drizzle-orm";
import { createTempDir, writeAssessment } from "./fixtures";

const SOLUTION = `class WorkingHours {
  constructor() {
    this.total = 0;
  }

  add(value) {
    this.total += value;
    return this.total;
  }
}

module.exports = WorkingHours;
`;

const PUBLIC_TESTS = `const WorkingHours = require("./solution");

module.exports = [
  {
    id: "p1",
    name: "Adds values",
    run(t) {
      const system = new WorkingHours();
      system.add(2);
      t.eq(system.add(3), 5);
    },
  },
];
`;

const HIDDEN_TESTS = `const WorkingHours = require("./solution");

module.exports = [
  {
    id: "h1",
    name: "Secret edge case",
    run(t) {
      const system = new WorkingHours();
      console.log("HIDDEN_SECRET_MARKER");
      t.eq(system.add(0), 0);
    },
  },
  {
    id: "h2",
    name: "Another secret",
    run(t) {
      const system = new WorkingHours();
      t.eq(system.add(10), 10);
    },
  },
];
`;

const BROKEN_SOLUTION = `class WorkingHours {
  add(value) {
    return value + 1;
  }
}

module.exports = WorkingHours;
`;

const root = createTempDir("assessment-app-flow-");

beforeAll(() => {
  writeAssessment(root, {
    id: "flow",
    levels: [
      {
        number: 1,
        title: "Accumulator",
        starter: SOLUTION,
        solution: SOLUTION,
        publicTests: PUBLIC_TESTS,
        hiddenTests: HIDDEN_TESTS,
      },
    ],
  });
  process.env.CODEASSESSMENT_ASSESSMENTS_DIR = root;
  resetReadyForTests();
});

describe("execution service", () => {
  it("runs public tests and records a run attempt", async () => {
    const { db } = await ensureReady();
    const response = await executeLevel({
      assessmentId: "flow",
      levelNumber: 1,
      files: { "solution.js": SOLUTION },
      type: "run",
    });

    expect(response.status).toBe("passed");
    expect(response.tests).toHaveLength(1);
    expect(response.hidden).toBeUndefined();

    const summary = getAssessmentSummary(
      db,
      (await ensureReady()).assessments[0]
    );
    expect(summary.levels[0].lastRun?.status).toBe("passed");
  });

  it("redacts hidden test details from submit responses and the database", async () => {
    const { db } = await ensureReady();
    const response = await executeLevel({
      assessmentId: "flow",
      levelNumber: 1,
      files: { "solution.js": BROKEN_SOLUTION },
      type: "submit",
    });

    expect(response.status).toBe("failed");
    expect(response.hidden?.total).toBe(2);
    expect(response.hidden?.passed).toBe(0);
    expect(JSON.stringify(response)).not.toContain("Secret edge case");
    expect(JSON.stringify(response)).not.toContain("Another secret");
    // Console output produced while hidden tests run must not be exposed either.
    expect(JSON.stringify(response)).not.toContain("HIDDEN_SECRET_MARKER");
    expect(JSON.stringify(response)).not.toContain("h1");
    expect(JSON.stringify(response)).not.toContain("h2");

    const stored = db
      .select()
      .from(testResults)
      .where(eq(testResults.testId, "hidden-1"))
      .all();
    expect(stored).toHaveLength(1);
    expect(stored[0].errorMessage).toBe("Hidden test failed.");
    expect(JSON.stringify(stored)).not.toContain("h1");
  });

  it("marks a level passed and the assessment complete on a passing submit", async () => {
    const { db, assessments } = await ensureReady();
    const pkg = assessments[0];

    const response = await executeLevel({
      assessmentId: "flow",
      levelNumber: 1,
      files: { "solution.js": SOLUTION },
      type: "submit",
    });

    expect(response.levelPassed).toBe(true);
    expect(response.assessmentCompleted).toBe(true);
    expect(response.hidden?.passed).toBe(2);

    const summary = getAssessmentSummary(db, pkg);
    expect(summary.completed).toBe(true);
    expect(summary.passedLevels).toBe(1);
    expect(summary.levels[0].passed).toBe(true);
    expect(summary.levels[0].codeModifiedSincePass).toBe(false);
  });

  it("flags code modified since the last passing submission", async () => {
    const { db, assessments } = await ensureReady();
    const pkg = assessments[0];
    const level = pkg.levels[0];

    expect(getLevelProgress(db, pkg.id, level).codeModifiedSincePass).toBe(false);

    saveFiles(db, pkg.id, 1, { "solution.js": "// edited after passing\n" });
    expect(getLevelProgress(db, pkg.id, level).codeModifiedSincePass).toBe(true);
  });

  it("seeds code for a fresh level and persists it", async () => {
    const { db } = await ensureReady();
    const levelDir = path.join(root, "flow", "levels", "level-1");
    expect(fs.existsSync(levelDir)).toBe(true);
    const summary = getAssessmentSummary(db, (await ensureReady()).assessments[0]);
    expect(summary.started).toBe(true);
  });
});
