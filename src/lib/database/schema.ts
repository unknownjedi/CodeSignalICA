import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  language: text("language").notNull(),
  levelCount: integer("level_count").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const levels = sqliteTable(
  "levels",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    levelNumber: integer("level_number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    difficulty: text("difficulty").notNull(),
    starterCode: text("starter_code").notNull(),
    timeoutMs: integer("timeout_ms").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    uniqueIndex("levels_assessment_number_idx").on(
      table.assessmentId,
      table.levelNumber
    ),
  ]
);

export const candidateCode = sqliteTable(
  "candidate_code",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    levelId: text("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("candidate_code_assessment_level_idx").on(
      table.assessmentId,
      table.levelId
    ),
  ]
);

export const attempts = sqliteTable(
  "attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    levelId: text("level_id")
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").notNull(),
    passedTests: integer("passed_tests").notNull(),
    totalTests: integer("total_tests").notNull(),
    durationMs: integer("duration_ms").notNull(),
    codeHash: text("code_hash").notNull(),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("attempts_assessment_level_idx").on(
      table.assessmentId,
      table.levelId,
      table.type
    ),
  ]
);

export const testResults = sqliteTable(
  "test_results",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attemptId: integer("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    testId: text("test_id").notNull(),
    status: text("status").notNull(),
    durationMs: integer("duration_ms").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("test_results_attempt_idx").on(table.attemptId)]
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    mode: text("mode").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    startedAt: timestamp("started_at"),
    lastLevelNumber: integer("last_level_number"),
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    createdAt: timestamp("created_at"),
  },
  (table) => [index("sessions_assessment_idx").on(table.assessmentId)]
);

export type AssessmentRow = typeof assessments.$inferSelect;
export type LevelRow = typeof levels.$inferSelect;
export type CandidateCodeRow = typeof candidateCode.$inferSelect;
export type AttemptRow = typeof attempts.$inferSelect;
export type TestResultRow = typeof testResults.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
