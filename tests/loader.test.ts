import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { discoverAssessments, loadAssessment } from "@/lib/assessments/loader";
import { createTempDir, writeAssessment } from "./fixtures";

describe("assessment loader", () => {
  it("loads a valid assessment package", () => {
    const root = createTempDir();
    writeAssessment(root, { id: "alpha", levels: [{ number: 1 }, { number: 2 }] });

    const { assessments, errors } = discoverAssessments(root);

    expect(errors).toEqual([]);
    expect(assessments).toHaveLength(1);
    expect(assessments[0].id).toBe("alpha");
    expect(assessments[0].levels.map((level) => level.number)).toEqual([1, 2]);
    expect(assessments[0].levels[0].timeoutMs).toBe(5000);
    expect(assessments[0].levels[0].description).toContain("# Level 1");
  });

  it("loads multiple assessments and skips hidden directories", () => {
    const root = createTempDir();
    writeAssessment(root, { id: "alpha", levels: [{ number: 1 }] });
    writeAssessment(root, { id: "beta", levels: [{ number: 1 }] });
    fs.mkdirSync(path.join(root, ".hidden"), { recursive: true });

    const { assessments, errors } = discoverAssessments(root);

    expect(errors).toEqual([]);
    expect(assessments.map((assessment) => assessment.id)).toEqual(["alpha", "beta"]);
  });

  it("reports invalid metadata and skips the assessment", () => {
    const root = createTempDir();
    writeAssessment(root, {
      id: "broken",
      levels: [{ number: 1 }],
      metadataOverride: { id: "broken", title: "Broken" },
    });

    const { assessments, errors } = discoverAssessments(root);

    expect(assessments).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("invalid metadata.json");
  });

  it("reports a metadata id that does not match the directory", () => {
    const root = createTempDir();
    const dir = writeAssessment(root, { id: "alpha", levels: [{ number: 1 }] });
    const metadata = JSON.parse(
      fs.readFileSync(path.join(dir, "metadata.json"), "utf8")
    );
    metadata.id = "other";
    fs.writeFileSync(path.join(dir, "metadata.json"), JSON.stringify(metadata));

    expect(() => loadAssessment(dir)).toThrow(/does not match directory name/);
  });

  it("reports missing required level files", () => {
    const root = createTempDir();
    writeAssessment(root, {
      id: "missing",
      levels: [{ number: 1, omitFiles: ["tests.hidden.js"] }],
    });

    const { assessments, errors } = discoverAssessments(root);

    expect(assessments).toEqual([]);
    expect(errors[0].message).toContain("missing required file");
    expect(errors[0].message).toContain("tests.hidden.js");
  });

  it("loads a multi-file workspace with locked files", () => {
    const root = createTempDir();
    writeAssessment(root, {
      id: "multi",
      levels: [
        {
          number: 1,
          workspace: {
            entry: "src/main.js",
            files: {
              "src/main.js": "// TODO\n",
              "src/helper.js": "module.exports = {};\n",
            },
            solutions: {
              "src/main.js": "module.exports = { run: () => 1 };\n",
            },
          },
        },
      ],
    });

    const { assessments, errors } = discoverAssessments(root);
    expect(errors).toEqual([]);
    const level = assessments[0].levels[0];
    expect(level.workspace.entry).toBe("src/main.js");
    expect(level.workspace.files).toEqual([
      { path: "src/main.js", editable: true },
      { path: "src/helper.js", editable: false },
    ]);
    expect(level.templateFiles["src/helper.js"]).toContain("module.exports");
    expect(level.solutionFiles["src/main.js"]).toContain("run");
    expect(level.solutionFiles["src/helper.js"]).toBeUndefined();
  });

  it("rejects a workspace.json whose entry is not editable", () => {
    const root = createTempDir();
    const dir = writeAssessment(root, {
      id: "badedit",
      levels: [
        {
          number: 1,
          workspace: {
            entry: "src/helper.js",
            files: {
              "src/main.js": "// TODO\n",
              "src/helper.js": "module.exports = {};\n",
            },
            solutions: { "src/main.js": "module.exports = {};\n" },
          },
        },
      ],
    });

    expect(() => loadAssessment(dir)).toThrow(/must be editable/);
  });

  it("reports a missing reference solution for an editable file", () => {
    const root = createTempDir();
    writeAssessment(root, {
      id: "nosol",
      levels: [
        {
          number: 1,
          workspace: {
            entry: "src/main.js",
            files: { "src/main.js": "// TODO\n" },
            solutions: {},
            editable: ["src/main.js"],
          },
        },
      ],
    });

    const { errors } = discoverAssessments(root);
    expect(errors[0].message).toContain("solution/src/main.js");
  });

  it("reports metadata levels that do not match directories", () => {
    const root = createTempDir();
    writeAssessment(root, {
      id: "mismatch",
      levels: [{ number: 1 }],
      metadataOverride: {
        id: "mismatch",
        title: "Mismatch",
        description: "desc",
        durationMinutes: 30,
        language: "javascript",
        levels: [
          { level: 1, title: "One", difficulty: "easy", timeoutMs: 5000 },
          { level: 2, title: "Two", difficulty: "easy", timeoutMs: 5000 },
        ],
      },
    });

    const { errors } = discoverAssessments(root);

    expect(errors[0].message).toContain("do not match level directories");
  });

  it("returns no assessments when the root directory is missing", () => {
    const { assessments, errors } = discoverAssessments(
      path.join(createTempDir(), "nope")
    );
    expect(assessments).toEqual([]);
    expect(errors).toEqual([]);
  });
});
