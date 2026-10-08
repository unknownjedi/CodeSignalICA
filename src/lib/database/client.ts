import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type AppDb = BetterSQLite3Database<typeof schema>;

/**
 * Application data lives outside the project directory.
 *
 * Writing a SQLite database inside the project makes the Next.js dev server's
 * file watcher recompile on every write, which triggers a browser reload loop.
 * Override with CODEASSESSMENT_DATA_DIR if needed.
 */
export function getDataDir(): string {
  return (
    process.env.CODEASSESSMENT_DATA_DIR ??
    path.join(os.homedir(), ".industry-coding-assessments")
  );
}

export function getDatabasePath(): string {
  return path.join(getDataDir(), "assessment.db");
}

export function getMigrationsFolder(): string {
  return path.join(process.cwd(), "drizzle");
}

/** Copies a legacy in-project `.data` database to the new location once. */
function migrateLegacyDataDir(targetDir: string): void {
  if (process.env.CODEASSESSMENT_DATA_DIR) {
    return;
  }
  const legacyDb = path.join(process.cwd(), ".data", "assessment.db");
  const targetDb = path.join(targetDir, "assessment.db");
  if (!fs.existsSync(legacyDb) || fs.existsSync(targetDb)) {
    return;
  }
  fs.mkdirSync(targetDir, { recursive: true });
  for (const suffix of ["", "-wal", "-shm"]) {
    const source = legacyDb + suffix;
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, targetDb + suffix);
    }
  }
}

export function createDb(databasePath: string): AppDb {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export function runMigrations(db: AppDb, migrationsFolder = getMigrationsFolder()) {
  migrate(db, { migrationsFolder });
}

let singleton: AppDb | null = null;

export function getDb(): AppDb {
  if (!singleton) {
    const dataDir = getDataDir();
    migrateLegacyDataDir(dataDir);
    singleton = createDb(path.join(dataDir, "assessment.db"));
    runMigrations(singleton);
  }
  return singleton;
}
