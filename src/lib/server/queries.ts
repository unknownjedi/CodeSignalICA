import type { AppDb } from "../database/client";
import type { AssessmentPackage, LevelPackage } from "../assessments/types";
import {
  getActiveSession,
  getLatestAttempt,
  getLatestPassedSubmit,
  getStoredFileMap,
  hashFiles,
  type AttemptSummary,
  type SessionRecord,
} from "../assessments/repository";
import { getLevelTestMeta } from "./test-meta";
import { eq } from "drizzle-orm";
import { candidateCode } from "../database/schema";
import type {
  AssessmentSummaryDto,
  AttemptDto,
  LevelDetailDto,
  LevelProgressDto,
  SessionDto,
} from "../api-types";

export type {
  AssessmentSummaryDto,
  AttemptDto,
  LevelDetailDto,
  LevelProgressDto,
  SessionDto,
};

function toAttemptDto(attempt: AttemptSummary | null): AttemptDto | null {
  if (!attempt) {
    return null;
  }
  return {
    status: attempt.status,
    passedTests: attempt.passedTests,
    totalTests: attempt.totalTests,
    durationMs: attempt.durationMs,
    createdAt: attempt.createdAt.toISOString(),
  };
}

export function buildSessionDto(session: SessionRecord | null): SessionDto | null {
  if (!session) {
    return null;
  }
  const durationMs = session.durationMinutes * 60_000;
  const elapsed = Date.now() - session.startedAt.getTime();
  const remainingMs = session.mode === "assessment" ? durationMs - elapsed : null;
  return {
    mode: session.mode,
    startedAt: session.startedAt.toISOString(),
    durationMinutes: session.durationMinutes,
    remainingMs,
    expired: remainingMs !== null && remainingMs <= 0,
    lastLevelNumber: session.lastLevelNumber,
  };
}

export function hasAnyCode(db: AppDb, assessmentId: string): boolean {
  const row = db
    .select({ id: candidateCode.id })
    .from(candidateCode)
    .where(eq(candidateCode.assessmentId, assessmentId))
    .limit(1)
    .get();
  return Boolean(row);
}

export function getLevelProgress(
  db: AppDb,
  assessmentId: string,
  level: LevelPackage
): LevelProgressDto {
  const storedFiles = getStoredFileMap(db, assessmentId, level);
  const passedSubmit = getLatestPassedSubmit(db, assessmentId, level.number);
  const lastSubmit = getLatestAttempt(db, assessmentId, level.number, "submit");
  const lastRun = getLatestAttempt(db, assessmentId, level.number, "run");

  const codeModifiedSincePass = Boolean(
    passedSubmit && storedFiles && hashFiles(storedFiles) !== passedSubmit.codeHash
  );

  return {
    number: level.number,
    title: level.title,
    difficulty: level.difficulty,
    timeoutMs: level.timeoutMs,
    passed: Boolean(passedSubmit),
    hasCode: Boolean(storedFiles),
    codeModifiedSincePass,
    lastSubmit: toAttemptDto(lastSubmit),
    lastRun: toAttemptDto(lastRun),
  };
}

export function getAssessmentSummary(
  db: AppDb,
  pkg: AssessmentPackage
): AssessmentSummaryDto {
  const levels = pkg.levels.map((level) => getLevelProgress(db, pkg.id, level));
  const passedLevels = levels.filter((level) => level.passed).length;
  const session = getActiveSession(db, pkg.id);
  return {
    id: pkg.id,
    title: pkg.title,
    description: pkg.description,
    durationMinutes: pkg.durationMinutes,
    language: pkg.language,
    levelCount: pkg.levels.length,
    passedLevels,
    started: hasAnyCode(db, pkg.id) || Boolean(session),
    completed: passedLevels === pkg.levels.length,
    levels,
    session: buildSessionDto(session),
  };
}

export async function getLevelDetail(
  db: AppDb,
  pkg: AssessmentPackage,
  level: LevelPackage
): Promise<LevelDetailDto> {
  const meta = await getLevelTestMeta(level);
  return {
    number: level.number,
    title: level.title,
    difficulty: level.difficulty,
    timeoutMs: level.timeoutMs,
    description: level.description,
    workspace: {
      entry: level.workspace.entry,
      files: level.workspace.files.map((file) => ({ path: file.path, editable: file.editable })),
    },
    publicTests: meta.publicTests.map(({ id, name }) => ({ id, name })),
    hiddenTestCount: meta.hiddenTestCount,
    progress: getLevelProgress(db, pkg.id, level),
    testMetaError: meta.error,
  };
}
