export type Difficulty = "easy" | "medium" | "hard";
export type TestVisibility = "public" | "hidden";

export interface LevelMetadata {
  level: number;
  title: string;
  difficulty: Difficulty;
  timeoutMs: number;
}

export interface AssessmentMetadata {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  language: "javascript";
  levels: LevelMetadata[];
}

/** A single file in a level's workspace. */
export interface WorkspaceFileRef {
  path: string;
  editable: boolean;
}

/** `workspace.json` inside a level directory. */
export interface WorkspaceManifest {
  entry: string;
  files: WorkspaceFileRef[];
}

export interface LevelPackage {
  number: number;
  title: string;
  difficulty: Difficulty;
  timeoutMs: number;
  description: string;
  /** Workspace manifest for this level. */
  workspace: WorkspaceManifest;
  /** Initial contents for every workspace file (locked + editable starters). */
  templateFiles: Record<string, string>;
  /** Reference solution contents for editable files only. */
  solutionFiles: Record<string, string>;
  publicTestsPath: string;
  hiddenTestsPath: string;
  dir: string;
}

export interface AssessmentPackage {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  language: "javascript";
  dir: string;
  levels: LevelPackage[];
}

export interface LoadError {
  dir: string;
  message: string;
}

export interface DiscoveryResult {
  assessments: AssessmentPackage[];
  errors: LoadError[];
}

export interface TestDefinitionMeta {
  id: string;
  name: string;
  visibility: TestVisibility;
}

export function editableFiles(level: LevelPackage): string[] {
  return level.workspace.files.filter((file) => file.editable).map((file) => file.path);
}

export function isEditable(level: LevelPackage, path: string): boolean {
  const file = level.workspace.files.find((candidate) => candidate.path === path);
  return Boolean(file?.editable);
}
