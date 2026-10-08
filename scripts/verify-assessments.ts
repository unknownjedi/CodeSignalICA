import { defaultAssessmentsDir, discoverAssessments } from "../src/lib/assessments/loader";
import { listLevelTests, runLevelTests } from "../src/lib/execution/runner";

interface Failure {
  location: string;
  message: string;
}

const failures: Failure[] = [];

function fail(location: string, message: string): void {
  failures.push({ location, message });
  console.error(`  ✗ ${location}: ${message}`);
}

async function main(): Promise<void> {
  const rootDir = defaultAssessmentsDir();
  console.log(`Verifying assessments in ${rootDir}\n`);

  const { assessments, errors } = discoverAssessments(rootDir);

  for (const error of errors) {
    fail(error.dir, error.message);
  }

  if (assessments.length === 0 && errors.length === 0) {
    fail(rootDir, "no assessment packages found");
  }

  for (const pkg of assessments) {
    console.log(`${pkg.title} (${pkg.id})`);
    for (const level of pkg.levels) {
      const location = `${pkg.id}/level-${level.number}`;

      const meta = await listLevelTests(level);
      if (meta.error) {
        fail(location, `test files failed to load: ${meta.error}`);
        continue;
      }
      const publicCount = meta.tests.filter((test) => test.visibility === "public").length;
      const hiddenCount = meta.tests.filter((test) => test.visibility === "hidden").length;
      if (publicCount === 0) {
        fail(location, "level has no public tests");
      }
      if (hiddenCount === 0) {
        fail(location, "level has no hidden tests");
      }

      const outcome = await runLevelTests({
        level,
        files: level.solutionFiles,
        suites: ["public", "hidden"],
        timeoutMs: level.timeoutMs,
      });

      if (outcome.status !== "passed") {
        const failing = outcome.tests.filter((test) => test.status !== "passed");
        const details = failing
          .map(
            (test) =>
              `${test.visibility}/${test.id} [${test.status}]${test.message ? `: ${test.message.split("\n").join(" | ")}` : ""}`
          )
          .join("; ");
        fail(
          location,
          `reference solution did not pass (${outcome.status}, ${outcome.passedTests}/${outcome.totalTests})${details ? ` — ${details}` : ""}`
        );
        continue;
      }

      console.log(
        `  ✓ level-${level.number}: ${publicCount} public + ${hiddenCount} hidden tests passed (${outcome.durationMs}ms)`
      );
    }
  }

  console.log("");
  if (failures.length > 0) {
    console.error(`Verification failed with ${failures.length} problem(s).`);
    process.exitCode = 1;
  } else {
    console.log(
      `Verification passed: ${assessments.length} assessment(s), ${assessments.reduce(
        (sum, pkg) => sum + pkg.levels.length,
        0
      )} level(s).`
    );
  }
}

main().catch((error) => {
  console.error("Verification crashed:", error);
  process.exitCode = 1;
});
