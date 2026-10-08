export type AttemptType = "run" | "submit";
export type TestVisibility = "public" | "hidden";

export interface WorkspaceFileRefDto {
  path: string;
  editable: boolean;
}

export interface AttemptDto {
  status: string;
  passedTests: number;
  totalTests: number;
  durationMs: number;
  createdAt: string;
}

export interface SessionDto {
  mode: "practice" | "assessment";
  startedAt: string;
  durationMinutes: number;
  remainingMs: number | null;
  expired: boolean;
  lastLevelNumber: number | null;
}

export interface LevelProgressDto {
  number: number;
  title: string;
  difficulty: string;
  timeoutMs: number;
  passed: boolean;
  hasCode: boolean;
  codeModifiedSincePass: boolean;
  lastSubmit: AttemptDto | null;
  lastRun: AttemptDto | null;
}

export interface AssessmentSummaryDto {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  language: string;
  levelCount: number;
  passedLevels: number;
  started: boolean;
  completed: boolean;
  levels: LevelProgressDto[];
  session: SessionDto | null;
}

export interface LevelDetailDto {
  number: number;
  title: string;
  difficulty: string;
  timeoutMs: number;
  description: string;
  workspace: {
    entry: string;
    files: WorkspaceFileRefDto[];
  };
  publicTests: { id: string; name: string }[];
  hiddenTestCount: number;
  progress: LevelProgressDto;
  testMetaError?: string;
}

export type FileMapDto = Record<string, string>;

export interface CodeResponseDto {
  files: FileMapDto;
  seeded: boolean;
  warning?: string;
  added?: string[];
  codeModifiedSincePass: boolean;
}

export interface PublicTestResultDto {
  id: string;
  name: string;
  status: string;
  durationMs: number;
  message?: string;
  /** console output captured from the candidate while this test ran. */
  logs?: string[];
}

export interface HiddenSummaryDto {
  total: number;
  passed: number;
  failed: number;
  errored: number;
  timedOut: number;
  skipped: number;
}

export interface ExecuteResponseDto {
  type: AttemptType;
  status: string;
  durationMs: number;
  passedTests: number;
  totalTests: number;
  tests: PublicTestResultDto[];
  hidden?: HiddenSummaryDto;
  levelPassed?: boolean;
  assessmentCompleted?: boolean;
  message?: string;
}
