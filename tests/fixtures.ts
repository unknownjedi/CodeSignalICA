import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function createTempDir(prefix = "assessment-fixture-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export interface WorkspaceFixture {
  entry: string;
  /** path -> initial contents */
  files: Record<string, string>;
  /** editable path -> reference solution contents */
  solutions: Record<string, string>;
  /** Optional explicit editable list (defaults to the solution keys). */
  editable?: string[];
}

export interface LevelFixture {
  number: number;
  title?: string;
  difficulty?: "easy" | "medium" | "hard";
  timeoutMs?: number;
  description?: string;
  starter?: string;
  solution?: string;
  publicTests?: string;
  hiddenTests?: string;
  omitFiles?: string[];
  workspace?: WorkspaceFixture;
}

export interface AssessmentFixtureOptions {
  id?: string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  levels: LevelFixture[];
  metadataOverride?: unknown;
}

const DEFAULT_STARTER = `class Solution {
  run() {
    // TODO
  }
}

module.exports = Solution;
`;

const DEFAULT_PUBLIC_TESTS = `module.exports = [
  { id: "public-1", name: "Public test one", run(t) { t.eq(1, 1); } },
];
`;

const DEFAULT_HIDDEN_TESTS = `module.exports = [
  { id: "hidden-1", name: "Hidden test one", run(t) { t.eq(2, 2); } },
];
`;

export function writeAssessment(
  rootDir: string,
  options: AssessmentFixtureOptions
): string {
  const id = options.id ?? "fixture-assessment";
  const dir = path.join(rootDir, id);
  fs.mkdirSync(dir, { recursive: true });

  const metadata =
    options.metadataOverride ??
    {
      id,
      title: options.title ?? "Fixture Assessment",
      description: options.description ?? "A fixture assessment.",
      durationMinutes: options.durationMinutes ?? 30,
      language: "javascript",
      levels: options.levels.map((level) => ({
        level: level.number,
        title: level.title ?? `Level ${level.number}`,
        difficulty: level.difficulty ?? "easy",
        timeoutMs: level.timeoutMs ?? 5000,
      })),
    };

  fs.writeFileSync(
    path.join(dir, "metadata.json"),
    JSON.stringify(metadata, null, 2)
  );

  for (const level of options.levels) {
    const levelDir = path.join(dir, "levels", `level-${level.number}`);
    fs.mkdirSync(levelDir, { recursive: true });

    if (level.workspace) {
      const editablePaths =
        level.workspace.editable ?? Object.keys(level.workspace.solutions);
      const manifest = {
        entry: level.workspace.entry,
        files: Object.keys(level.workspace.files).map((filePath) => ({
          path: filePath,
          editable: editablePaths.includes(filePath),
        })),
      };
      fs.writeFileSync(
        path.join(levelDir, "workspace.json"),
        JSON.stringify(manifest, null, 2)
      );
      for (const [filePath, content] of Object.entries(level.workspace.files)) {
        const target = path.join(levelDir, "files", filePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      }
      for (const [filePath, content] of Object.entries(level.workspace.solutions)) {
        const target = path.join(levelDir, "solution", filePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
      }
    } else {
      const files: Record<string, string> = {
        "starter.js": level.starter ?? DEFAULT_STARTER,
        "solution.js": level.solution ?? DEFAULT_STARTER,
      };
      for (const [name, content] of Object.entries(files)) {
        if (level.omitFiles?.includes(name)) continue;
        fs.writeFileSync(path.join(levelDir, name), content);
      }
    }

    const testFiles: Record<string, string> = {
      "description.md": level.description ?? `# Level ${level.number}`,
      "tests.public.js": level.publicTests ?? DEFAULT_PUBLIC_TESTS,
      "tests.hidden.js": level.hiddenTests ?? DEFAULT_HIDDEN_TESTS,
    };
    for (const [name, content] of Object.entries(testFiles)) {
      if (level.omitFiles?.includes(name)) continue;
      fs.writeFileSync(path.join(levelDir, name), content);
    }
  }

  return dir;
}
