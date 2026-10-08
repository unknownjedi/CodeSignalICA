import type { AppDb } from "../database/client";
import type { AssessmentPackage, TestVisibility } from "../assessments/types";
import {
  getLatestPassedSubmit,
  hashFiles,
  normalizeFiles,
  recordAttempt,
  saveFiles,
  type AttemptType,
  type FileMap,
} from "../assessments/repository";
import { runLevelTests, type RunOutcome, type TestOutcome } from "../execution/runner";
import { ensureReady } from "./bootstrap";
import { withAssessmentLock } from "./lock";
import type {
  ExecuteResponseDto,
  HiddenSummaryDto,
  PublicTestResultDto,
} from "../api-types";

export type ExecuteResponse = ExecuteResponseDto;

export class AssessmentNotFoundError extends Error {}
export class LevelNotFoundError extends Error {}

function publicTestDto(test: TestOutcome): PublicTestResultDto {
  const dto: PublicTestResultDto = {
    id: test.id,
    name: test.name,
    status: test.status,
    durationMs: test.durationMs,
  };
  if (test.message) {
    dto.message = test.message;
  }
  if (test.logs && test.logs.length > 0) {
    dto.logs = test.logs;
  }
  return dto;
}

function hiddenSummary(tests: TestOutcome[]): HiddenSummaryDto {
  const hidden = tests.filter((test) => test.visibility === "hidden");
  return {
    total: hidden.length,
    passed: hidden.filter((test) => test.status === "passed").length,
    failed: hidden.filter((test) => test.status === "failed").length,
    errored: hidden.filter((test) => test.status === "error").length,
    timedOut: hidden.filter((test) => test.status === "timeout").length,
    skipped: hidden.filter((test) => test.status === "skipped").length,
  };
}

function genericHiddenMessage(status: string): string | null {
  switch (status) {
    case "passed":
      return null;
    case "error":
      return "Hidden test error.";
    case "timeout":
      return "Hidden test timed out.";
    case "skipped":
      return "Hidden test skipped.";
    default:
      return "Hidden test failed.";
  }
}

function persistTestResults(outcome: RunOutcome) {
  let hiddenCounter = 0;
  return outcome.tests.map((test) => {
    if (test.visibility === "hidden") {
      hiddenCounter += 1;
      return {
        testId: `hidden-${hiddenCounter}`,
        status: test.status,
        durationMs: test.durationMs,
        errorMessage: genericHiddenMessage(test.status),
      };
    }
    return {
      testId: test.id,
      status: test.status,
      durationMs: test.durationMs,
      errorMessage: test.message ?? null,
    };
  });
}

function assessmentCompleted(db: AppDb, pkg: AssessmentPackage): boolean {
  return pkg.levels.every((level) =>
    Boolean(getLatestPassedSubmit(db, pkg.id, level.number))
  );
}

export async function executeLevel(options: {
  assessmentId: string;
  levelNumber: number;
  files: FileMap;
  type: AttemptType;
}): Promise<ExecuteResponse> {
  const { db, assessments } = await ensureReady();
  const pkg = assessments.find((assessment) => assessment.id === options.assessmentId);
  if (!pkg) {
    throw new AssessmentNotFoundError(`Unknown assessment: ${options.assessmentId}`);
  }
  const level = pkg.levels.find((candidate) => candidate.number === options.levelNumber);
  if (!level) {
    throw new LevelNotFoundError(
      `Unknown level ${options.levelNumber} for assessment ${options.assessmentId}`
    );
  }

  const files = normalizeFiles(level, options.files);

  return withAssessmentLock(pkg.id, async () => {
    saveFiles(db, pkg.id, level.number, files);

    const suites: TestVisibility[] =
      options.type === "submit" ? ["public", "hidden"] : ["public"];
    const outcome = await runLevelTests({
      level,
      files,
      suites,
      timeoutMs: level.timeoutMs,
    });

    const isSubmit = options.type === "submit";
    const publicTests = outcome.tests.filter((test) => test.visibility === "public");

    recordAttempt(db, {
      assessmentId: pkg.id,
      levelNumber: level.number,
      type: options.type,
      status: outcome.status,
      passedTests: isSubmit
        ? outcome.passedTests
        : publicTests.filter((test) => test.status === "passed").length,
      totalTests: isSubmit ? outcome.totalTests : publicTests.length,
      durationMs: outcome.durationMs,
      codeHash: hashFiles(files),
      testResults: persistTestResults(outcome),
    });

    const response: ExecuteResponse = {
      type: options.type,
      status: outcome.status,
      durationMs: outcome.durationMs,
      passedTests: publicTests.filter((test) => test.status === "passed").length,
      totalTests: publicTests.length,
      tests: publicTests.map(publicTestDto),
    };

    if (outcome.message) {
      response.message = outcome.message;
    }

    if (isSubmit) {
      response.hidden = hiddenSummary(outcome.tests);
      response.levelPassed = outcome.status === "passed";
      response.assessmentCompleted = assessmentCompleted(db, pkg);
    }

    return response;
  });
}
