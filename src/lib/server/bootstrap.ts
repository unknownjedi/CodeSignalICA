import { getDb, type AppDb } from "../database/client";
import { discoverAssessments, defaultAssessmentsDir } from "../assessments/loader";
import { syncAssessmentPackages } from "../assessments/repository";
import { cleanTmpDirs } from "../execution/runner";
import type { AssessmentPackage } from "../assessments/types";

interface AppContext {
  db: AppDb;
  assessments: AssessmentPackage[];
}

let readyPromise: Promise<AppContext> | null = null;

async function initialize(): Promise<AppContext> {
  const db = getDb();
  await cleanTmpDirs();

  const { assessments, errors } = discoverAssessments();
  for (const error of errors) {
    console.warn(`[assessments] Skipping "${error.dir}": ${error.message}`);
  }

  syncAssessmentPackages(db, assessments);
  return { db, assessments };
}

export function ensureReady(): Promise<AppContext> {
  if (!readyPromise) {
    readyPromise = initialize();
  }
  return readyPromise;
}

export function resetReadyForTests(): void {
  readyPromise = null;
}

export function getAssessmentsDir(): string {
  return defaultAssessmentsDir();
}
