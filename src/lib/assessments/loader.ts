import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type {
  AssessmentPackage,
  DiscoveryResult,
  LevelPackage,
  LoadError,
  WorkspaceManifest,
} from "./types";

const levelMetadataSchema = z.object({
  level: z.number().int().positive(),
  title: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeoutMs: z.number().int().positive(),
});

const assessmentMetadataSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*$/, "id must be kebab-case"),
  title: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  language: z.literal("javascript"),
  levels: z.array(levelMetadataSchema).min(1),
});

const workspaceManifestSchema = z.object({
  entry: z.string().min(1),
  files: z
    .array(
      z.object({
        path: z.string().min(1),
        editable: z.boolean(),
      })
    )
    .min(1),
});

const LEGACY_ENTRY = "solution.js";

export function defaultAssessmentsDir(): string {
  return process.env.CODEASSESSMENT_ASSESSMENTS_DIR ?? path.join(process.cwd(), "assessments");
}

function isDirectory(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

function isSafeRelativePath(candidate: string): boolean {
  if (!candidate || path.isAbsolute(candidate)) {
    return false;
  }
  const normalized = path.normalize(candidate);
  return !normalized.startsWith("..") && !normalized.split(path.sep).includes("..");
}

function readRequiredFile(filePath: string, label: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing required file: ${label}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  if (content.trim() === "") {
    throw new Error(`required file is empty: ${label}`);
  }
  return content;
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

function loadManifestLevel(levelDir: string, levelLabel: string): {
  workspace: WorkspaceManifest;
  templateFiles: Record<string, string>;
  solutionFiles: Record<string, string>;
} {
  const manifestPath = path.join(levelDir, "workspace.json");
  let parsed: z.infer<typeof workspaceManifestSchema>;
  try {
    parsed = workspaceManifestSchema.parse(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`invalid workspace.json: ${formatZodIssues(error)}`);
    }
    throw new Error(`invalid workspace.json: ${(error as Error).message}`);
  }

  const seen = new Set<string>();
  for (const file of parsed.files) {
    if (!isSafeRelativePath(file.path)) {
      throw new Error(`invalid file path in workspace.json: ${file.path}`);
    }
    if (path.posix.normalize(file.path) !== file.path) {
      throw new Error(`file paths in workspace.json must be normalized: ${file.path}`);
    }
    if (seen.has(file.path)) {
      throw new Error(`duplicate file path in workspace.json: ${file.path}`);
    }
    seen.add(file.path);
  }

  // Reject collisions where one path is a directory prefix of another.
  for (const file of parsed.files) {
    for (const other of parsed.files) {
      if (file.path !== other.path && other.path.startsWith(`${file.path}/`)) {
        throw new Error(
          `conflicting file paths in workspace.json: "${file.path}" is a prefix of "${other.path}"`
        );
      }
    }
  }

  if (!seen.has(parsed.entry)) {
    throw new Error(`workspace.json entry "${parsed.entry}" is not listed in files`);
  }
  const entryFile = parsed.files.find((file) => file.path === parsed.entry);
  if (!entryFile?.editable) {
    throw new Error(`workspace.json entry "${parsed.entry}" must be editable`);
  }

  const filesDir = path.join(levelDir, "files");
  const solutionDir = path.join(levelDir, "solution");

  const templateFiles: Record<string, string> = {};
  const solutionFiles: Record<string, string> = {};

  for (const file of parsed.files) {
    templateFiles[file.path] = readRequiredFile(
      path.join(filesDir, file.path),
      `${levelLabel}/files/${file.path}`
    );
    if (file.editable) {
      solutionFiles[file.path] = readRequiredFile(
        path.join(solutionDir, file.path),
        `${levelLabel}/solution/${file.path}`
      );
    }
  }

  return { workspace: parsed, templateFiles, solutionFiles };
}

function loadLegacyLevel(levelDir: string, levelLabel: string): {
  workspace: WorkspaceManifest;
  templateFiles: Record<string, string>;
  solutionFiles: Record<string, string>;
} {
  const starterCode = readRequiredFile(
    path.join(levelDir, "starter.js"),
    `${levelLabel}/starter.js`
  );
  const solutionCode = readRequiredFile(
    path.join(levelDir, "solution.js"),
    `${levelLabel}/solution.js`
  );
  return {
    workspace: { entry: LEGACY_ENTRY, files: [{ path: LEGACY_ENTRY, editable: true }] },
    templateFiles: { [LEGACY_ENTRY]: starterCode },
    solutionFiles: { [LEGACY_ENTRY]: solutionCode },
  };
}

function loadLevel(
  levelDir: string,
  levelLabel: string,
  metadata: z.infer<typeof levelMetadataSchema>
): LevelPackage {
  const descriptionPath = path.join(levelDir, "description.md");
  const publicTestsPath = path.join(levelDir, "tests.public.js");
  const hiddenTestsPath = path.join(levelDir, "tests.hidden.js");

  const description = readRequiredFile(descriptionPath, `${levelLabel}/description.md`);
  readRequiredFile(publicTestsPath, `${levelLabel}/tests.public.js`);
  readRequiredFile(hiddenTestsPath, `${levelLabel}/tests.hidden.js`);

  const hasManifest = fs.existsSync(path.join(levelDir, "workspace.json"));
  const workspaceData = hasManifest
    ? loadManifestLevel(levelDir, levelLabel)
    : loadLegacyLevel(levelDir, levelLabel);

  return {
    number: metadata.level,
    title: metadata.title,
    difficulty: metadata.difficulty,
    timeoutMs: metadata.timeoutMs,
    description,
    workspace: workspaceData.workspace,
    templateFiles: workspaceData.templateFiles,
    solutionFiles: workspaceData.solutionFiles,
    publicTestsPath,
    hiddenTestsPath,
    dir: levelDir,
  };
}

export function loadAssessment(assessmentDir: string): AssessmentPackage {
  const metadataPath = path.join(assessmentDir, "metadata.json");
  if (!fs.existsSync(metadataPath)) {
    throw new Error("missing metadata.json");
  }

  let rawMetadata: unknown;
  try {
    rawMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    throw new Error(`metadata.json is not valid JSON: ${(error as Error).message}`);
  }

  const parsed = assessmentMetadataSchema.safeParse(rawMetadata);
  if (!parsed.success) {
    throw new Error(`invalid metadata.json: ${formatZodIssues(parsed.error)}`);
  }
  const metadata = parsed.data;

  if (path.basename(assessmentDir) !== metadata.id) {
    throw new Error(
      `metadata id "${metadata.id}" does not match directory name "${path.basename(assessmentDir)}"`
    );
  }

  const levelsDir = path.join(assessmentDir, "levels");
  if (!isDirectory(levelsDir)) {
    throw new Error("missing levels directory");
  }

  const levelDirs = fs
    .readdirSync(levelsDir)
    .filter((entry) => /^level-\d+$/.test(entry))
    .sort((a, b) => Number(a.slice("level-".length)) - Number(b.slice("level-".length)));

  if (levelDirs.length === 0) {
    throw new Error("no level-* directories found under levels/");
  }

  const numbersOnDisk = levelDirs.map((entry) => Number(entry.slice("level-".length)));
  const expectedNumbers = metadata.levels.map((level) => level.level);
  const missingMetadata = numbersOnDisk.filter((n) => !expectedNumbers.includes(n));
  const missingDirs = expectedNumbers.filter((n) => !numbersOnDisk.includes(n));
  if (missingMetadata.length > 0 || missingDirs.length > 0) {
    throw new Error(
      `metadata levels ${JSON.stringify(expectedNumbers)} do not match level directories ${JSON.stringify(numbersOnDisk)}`
    );
  }

  const levels = levelDirs.map((levelDirName) => {
    const number = Number(levelDirName.slice("level-".length));
    const levelMetadata = metadata.levels.find((level) => level.level === number);
    if (!levelMetadata) {
      throw new Error(`level ${number}: missing entry in metadata.json levels`);
    }
    return loadLevel(path.join(levelsDir, levelDirName), levelDirName, levelMetadata);
  });

  return {
    id: metadata.id,
    title: metadata.title,
    description: metadata.description,
    durationMinutes: metadata.durationMinutes,
    language: metadata.language,
    dir: assessmentDir,
    levels,
  };
}

export function discoverAssessments(rootDir = defaultAssessmentsDir()): DiscoveryResult {
  const assessments: AssessmentPackage[] = [];
  const errors: LoadError[] = [];

  if (!isDirectory(rootDir)) {
    return { assessments, errors };
  }

  const entries = fs
    .readdirSync(path.join(/* turbopackIgnore: true */ rootDir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  for (const entry of entries) {
    const assessmentDir = path.join(/* turbopackIgnore: true */ rootDir, entry);
    try {
      assessments.push(loadAssessment(assessmentDir));
    } catch (error) {
      errors.push({ dir: assessmentDir, message: (error as Error).message });
    }
  }

  return { assessments, errors };
}
