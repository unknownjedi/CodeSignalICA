import fs from "node:fs";
import { listLevelTests } from "../execution/runner";
import type { LevelPackage, TestDefinitionMeta } from "../assessments/types";

interface CacheEntry {
  signature: string;
  tests: TestDefinitionMeta[];
}

const cache = new Map<string, CacheEntry>();

function signature(level: LevelPackage): string {
  const stat = (file: string) => {
    try {
      const info = fs.statSync(file);
      return `${info.mtimeMs}:${info.size}`;
    } catch {
      return "missing";
    }
  };
  return `${stat(level.publicTestsPath)}|${stat(level.hiddenTestsPath)}`;
}

export interface LevelTestMeta {
  publicTests: TestDefinitionMeta[];
  hiddenTestCount: number;
  error?: string;
}

export async function getLevelTestMeta(level: LevelPackage): Promise<LevelTestMeta> {
  const currentSignature = signature(level);
  const cached = cache.get(level.dir);
  if (cached && cached.signature === currentSignature) {
    return split(cached.tests);
  }

  const { tests, error } = await listLevelTests(level);
  if (error) {
    return { publicTests: [], hiddenTestCount: 0, error };
  }

  cache.set(level.dir, { signature: currentSignature, tests });
  return split(tests);
}

function split(tests: TestDefinitionMeta[]): LevelTestMeta {
  return {
    publicTests: tests.filter((test) => test.visibility === "public"),
    hiddenTestCount: tests.filter((test) => test.visibility === "hidden").length,
  };
}
