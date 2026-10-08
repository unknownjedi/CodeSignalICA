import crypto from "node:crypto";
import { and, desc, eq, isNull, lt } from "drizzle-orm";
import type { AppDb } from "../database/client";
import {
  assessments,
  attempts,
  candidateCode,
  levels,
  sessions,
  testResults,
} from "../database/schema";
import type { AssessmentPackage, LevelPackage } from "./types";
import { mergeStarterCode } from "./merge";

export type AttemptType = "run" | "submit";
export type AttemptStatus = "passed" | "failed" | "error" | "timeout";

export type FileMap = Record<string, string>;

export interface AttemptSummary {
  id: number;
  status: AttemptStatus;
  passedTests: number;
  totalTests: number;
  durationMs: number;
  codeHash: string;
  createdAt: Date;
}

export interface SessionRecord {
  id: number;
  assessmentId: string;
  mode: "practice" | "assessment";
  durationMinutes: number;
  startedAt: Date;
  lastLevelNumber: number | null;
}

export function levelId(assessmentId: string, levelNumber: number): string {
  return `${assessmentId}:${levelNumber}`;
}

/**
 * Produces a deterministic serialization of the editable file contents so that
 * hashes are stable regardless of object key insertion order.
 */
export function serializeFiles(files: FileMap): string {
  const sortedKeys = Object.keys(files).sort();
  const ordered: FileMap = {};
  for (const key of sortedKeys) {
    ordered[key] = files[key];
  }
  return JSON.stringify(ordered);
}

export function hashFiles(files: FileMap): string {
  return crypto.createHash("sha256").update(serializeFiles(files)).digest("hex");
}

/** Keeps only editable files, filling any gaps from the level template. */
export function normalizeFiles(level: LevelPackage, files: FileMap): FileMap {
  const result: FileMap = {};
  for (const file of level.workspace.files) {
    if (!file.editable) continue;
    const value = files[file.path];
    result[file.path] =
      typeof value === "string" ? value : (level.templateFiles[file.path] ?? "");
  }
  return result;
}

function parseStoredFiles(raw: string, fallbackEntry: string): FileMap {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const result: FileMap = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") {
          result[key] = value;
        }
      }
      return result;
    }
  } catch {
    // fall through to legacy handling
  }
  // Legacy single-file storage: the whole blob was the entry file's contents.
  return { [fallbackEntry]: raw };
}

export function syncAssessmentPackages(db: AppDb, packages: AssessmentPackage[]): void {
  const now = new Date();
  for (const pkg of packages) {
    db.insert(assessments)
      .values({
        id: pkg.id,
        title: pkg.title,
        description: pkg.description,
        durationMinutes: pkg.durationMinutes,
        language: pkg.language,
        levelCount: pkg.levels.length,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: assessments.id,
        set: {
          title: pkg.title,
          description: pkg.description,
          durationMinutes: pkg.durationMinutes,
          language: pkg.language,
          levelCount: pkg.levels.length,
          updatedAt: now,
        },
      })
      .run();

    for (const level of pkg.levels) {
      const id = levelId(pkg.id, level.number);
      const starterSkeleton = Object.fromEntries(
        Object.entries(level.templateFiles).map(([filePath, content]) => [filePath, content])
      );
      db.insert(levels)
        .values({
          id,
          assessmentId: pkg.id,
          levelNumber: level.number,
          title: level.title,
          description: level.description,
          difficulty: level.difficulty,
          starterCode: JSON.stringify(starterSkeleton),
          timeoutMs: level.timeoutMs,
          createdAt: now,
        })
        .onConflictDoUpdate({
          target: levels.id,
          set: {
            title: level.title,
            description: level.description,
            difficulty: level.difficulty,
            starterCode: JSON.stringify(starterSkeleton),
            timeoutMs: level.timeoutMs,
          },
        })
        .run();
    }
  }
}

export interface SeedResult {
  files: FileMap;
  seeded: boolean;
  warning?: string;
  /** Files added by the merge, as `path:declaration` labels. */
  added: string[];
}

export function getOrSeedFiles(
  db: AppDb,
  pkg: AssessmentPackage,
  levelNumber: number
): SeedResult {
  const level = pkg.levels.find((candidate) => candidate.number === levelNumber);
  if (!level) {
    throw new Error(`Unknown level ${levelNumber}`);
  }

  const lid = levelId(pkg.id, levelNumber);
  const existing = db
    .select()
    .from(candidateCode)
    .where(and(eq(candidateCode.assessmentId, pkg.id), eq(candidateCode.levelId, lid)))
    .get();

  if (existing) {
    return {
      files: normalizeFiles(level, parseStoredFiles(existing.code, level.workspace.entry)),
      seeded: false,
      added: [],
    };
  }

  const previousRow = db
    .select({ code: candidateCode.code, levelNumber: levels.levelNumber })
    .from(candidateCode)
    .innerJoin(levels, eq(candidateCode.levelId, levels.id))
    .where(and(eq(candidateCode.assessmentId, pkg.id), lt(levels.levelNumber, levelNumber)))
    .orderBy(desc(levels.levelNumber))
    .limit(1)
    .get();

  const previousLevel = previousRow
    ? pkg.levels.find((candidate) => candidate.number === previousRow.levelNumber)
    : undefined;
  const baseFiles: FileMap =
    previousRow && previousLevel
      ? normalizeFiles(
          previousLevel,
          parseStoredFiles(previousRow.code, previousLevel.workspace.entry)
        )
      : {};

  const files: FileMap = {};
  const added: string[] = [];
  let warning: string | undefined;

  for (const file of level.workspace.files) {
    if (!file.editable) continue;
    const template = level.templateFiles[file.path] ?? "";
    const previous = baseFiles[file.path];
    if (previous !== undefined) {
      const merged = mergeStarterCode(previous, template);
      files[file.path] = merged.code;
      if (merged.warning) warning = merged.warning;
      for (const declaration of merged.added) {
        added.push(`${file.path}:${declaration}`);
      }
    } else {
      files[file.path] = template;
    }
  }

  saveFiles(db, pkg.id, levelNumber, files);
  return { files, seeded: true, warning, added };
}

export function saveFiles(
  db: AppDb,
  assessmentId: string,
  levelNumber: number,
  files: FileMap
): void {
  db.insert(candidateCode)
    .values({
      assessmentId,
      levelId: levelId(assessmentId, levelNumber),
      code: serializeFiles(files),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [candidateCode.assessmentId, candidateCode.levelId],
      set: { code: serializeFiles(files), updatedAt: new Date() },
    })
    .run();
}

export function getStoredFileMap(
  db: AppDb,
  assessmentId: string,
  level: LevelPackage
): FileMap | null {
  const row = db
    .select()
    .from(candidateCode)
    .where(
      and(
        eq(candidateCode.assessmentId, assessmentId),
        eq(candidateCode.levelId, levelId(assessmentId, level.number))
      )
    )
    .get();
  if (!row) {
    return null;
  }
  return normalizeFiles(level, parseStoredFiles(row.code, level.workspace.entry));
}

export interface RecordAttemptInput {
  assessmentId: string;
  levelNumber: number;
  type: AttemptType;
  status: AttemptStatus;
  passedTests: number;
  totalTests: number;
  durationMs: number;
  codeHash: string;
  testResults: {
    testId: string;
    status: string;
    durationMs: number;
    errorMessage?: string | null;
  }[];
}

export function recordAttempt(db: AppDb, input: RecordAttemptInput): number {
  const inserted = db
    .insert(attempts)
    .values({
      assessmentId: input.assessmentId,
      levelId: levelId(input.assessmentId, input.levelNumber),
      type: input.type,
      status: input.status,
      passedTests: input.passedTests,
      totalTests: input.totalTests,
      durationMs: Math.round(input.durationMs),
      codeHash: input.codeHash,
      createdAt: new Date(),
    })
    .returning({ id: attempts.id })
    .get();

  if (input.testResults.length > 0) {
    db.insert(testResults)
      .values(
        input.testResults.map((result) => ({
          attemptId: inserted.id,
          testId: result.testId,
          status: result.status,
          durationMs: Math.round(result.durationMs),
          errorMessage: result.errorMessage ?? null,
          createdAt: new Date(),
        }))
      )
      .run();
  }

  return inserted.id;
}

function toAttemptSummary(
  row: typeof attempts.$inferSelect | undefined
): AttemptSummary | null {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    status: row.status as AttemptStatus,
    passedTests: row.passedTests,
    totalTests: row.totalTests,
    durationMs: row.durationMs,
    codeHash: row.codeHash,
    createdAt: row.createdAt,
  };
}

export function getLatestAttempt(
  db: AppDb,
  assessmentId: string,
  levelNumber: number,
  type: AttemptType
): AttemptSummary | null {
  const row = db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.assessmentId, assessmentId),
        eq(attempts.levelId, levelId(assessmentId, levelNumber)),
        eq(attempts.type, type)
      )
    )
    .orderBy(desc(attempts.id))
    .limit(1)
    .get();
  return toAttemptSummary(row);
}

export function getLatestPassedSubmit(
  db: AppDb,
  assessmentId: string,
  levelNumber: number
): AttemptSummary | null {
  const row = db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.assessmentId, assessmentId),
        eq(attempts.levelId, levelId(assessmentId, levelNumber)),
        eq(attempts.type, "submit"),
        eq(attempts.status, "passed")
      )
    )
    .orderBy(desc(attempts.id))
    .limit(1)
    .get();
  return toAttemptSummary(row);
}

export function getActiveSession(
  db: AppDb,
  assessmentId: string
): SessionRecord | null {
  const row = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.assessmentId, assessmentId), isNull(sessions.endedAt)))
    .orderBy(desc(sessions.id))
    .limit(1)
    .get();
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    mode: row.mode as "practice" | "assessment",
    durationMinutes: row.durationMinutes,
    startedAt: row.startedAt,
    lastLevelNumber: row.lastLevelNumber,
  };
}

export function startSession(
  db: AppDb,
  assessmentId: string,
  mode: "practice" | "assessment",
  durationMinutes: number
): SessionRecord {
  const existing = getActiveSession(db, assessmentId);
  if (existing) {
    return existing;
  }
  const startedAt = new Date();
  const inserted = db
    .insert(sessions)
    .values({
      assessmentId,
      mode,
      durationMinutes,
      startedAt,
      createdAt: startedAt,
    })
    .returning({ id: sessions.id })
    .get();

  return {
    id: inserted.id,
    assessmentId,
    mode,
    durationMinutes,
    startedAt,
    lastLevelNumber: null,
  };
}

export function setSessionLastLevel(
  db: AppDb,
  sessionId: number,
  levelNumber: number
): void {
  db.update(sessions)
    .set({ lastLevelNumber: levelNumber })
    .where(eq(sessions.id, sessionId))
    .run();
}

export function findLevel(
  pkg: AssessmentPackage,
  levelNumber: number
): LevelPackage | undefined {
  return pkg.levels.find((level) => level.number === levelNumber);
}
