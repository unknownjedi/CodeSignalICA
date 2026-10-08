"use client";

import type {
  ExecuteResponseDto,
  LevelProgressDto,
  PublicTestResultDto,
} from "@/lib/api-types";

const STATUS_ICON: Record<string, { symbol: string; className: string }> = {
  passed: { symbol: "✓", className: "text-emerald-400" },
  failed: { symbol: "✗", className: "text-red-400" },
  error: { symbol: "⚠", className: "text-amber-400" },
  timeout: { symbol: "⏱", className: "text-amber-400" },
  skipped: { symbol: "–", className: "text-slate-500" },
  idle: { symbol: "○", className: "text-slate-600" },
};

function resultFor(
  result: ExecuteResponseDto | null,
  testId: string
): PublicTestResultDto | null {
  if (!result) {
    return null;
  }
  return result.tests.find((test) => test.id === testId) ?? null;
}

function overallLabel(result: ExecuteResponseDto): {
  text: string;
  className: string;
} {
  switch (result.status) {
    case "passed":
      return { text: "Passed", className: "text-emerald-400" };
    case "timeout":
      return { text: "Execution timed out.", className: "text-amber-400" };
    case "error":
      return { text: "Runtime error.", className: "text-amber-400" };
    default:
      return { text: "Level not passed.", className: "text-red-400" };
  }
}

export default function TestResults({
  publicTests,
  hiddenTestCount,
  runResult,
  submitResult,
  progress,
  testMetaError,
}: {
  publicTests: { id: string; name: string }[];
  hiddenTestCount: number;
  runResult: ExecuteResponseDto | null;
  submitResult: ExecuteResponseDto | null;
  progress: LevelProgressDto;
  testMetaError?: string;
}) {
  const result = submitResult ?? runResult;
  const overall = result ? overallLabel(result) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Public tests
        </h2>
        {testMetaError ? (
          <p className="mt-2 text-xs text-amber-400">
            Test definitions could not be loaded: {testMetaError}
          </p>
        ) : null}
        <ul className="mt-2 space-y-2">
          {publicTests.map((test) => {
            const outcome = resultFor(result, test.id);
            const icon = STATUS_ICON[outcome?.status ?? "idle"] ?? STATUS_ICON.idle;
            const showMessage =
              outcome &&
              outcome.status !== "passed" &&
              outcome.status !== "skipped" &&
              outcome.message;
            return (
              <li key={test.id} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 w-4 text-center ${icon.className}`}>
                    {icon.symbol}
                  </span>
                  <span className="text-slate-300">{test.name}</span>
                </div>
                {showMessage ? (
                  <pre className="mt-1 ml-6 overflow-x-auto whitespace-pre-wrap rounded border border-red-500/30 bg-red-500/5 px-2 py-1.5 font-mono text-xs text-red-300">
                    {outcome.message}
                  </pre>
                ) : null}
                {outcome?.logs && outcome.logs.length > 0 ? (
                  <div className="mt-1 ml-6">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Console
                    </div>
                    <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-slate-700 bg-slate-900/70 px-2 py-1.5 font-mono text-xs text-slate-300">
                      {outcome.logs.join("\n")}
                    </pre>
                  </div>
                ) : null}
              </li>
            );
          })}
          {publicTests.length === 0 && !testMetaError ? (
            <li className="text-xs text-slate-500">No public tests defined.</li>
          ) : null}
        </ul>

        <h2 className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Hidden tests
        </h2>
        <div className="mt-2 text-sm">
          {submitResult?.hidden ? (
            submitResult.hidden.passed === submitResult.hidden.total ? (
              <span className="text-emerald-400">
                ✓ {submitResult.hidden.passed} / {submitResult.hidden.total} passed
              </span>
            ) : (
              <div>
                <span className="text-red-400">
                  ✗ {submitResult.hidden.passed} / {submitResult.hidden.total} passed
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  {submitResult.hidden.total - submitResult.hidden.passed} hidden
                  test
                  {submitResult.hidden.total - submitResult.hidden.passed === 1
                    ? ""
                    : "s"}{" "}
                  failed.
                </p>
              </div>
            )
          ) : (
            <span className="text-slate-500">
              {hiddenTestCount} hidden test{hiddenTestCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {result ? (
          <div className="mt-5 border-t border-slate-800 pt-3">
            <div className={`text-sm font-medium ${overall?.className}`}>
              {overall?.text}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Public tests: {result.passedTests} / {result.totalTests} · Execution
              time: {Math.round(result.durationMs)}ms
            </div>
            {result.message && result.status !== "failed" ? (
              <p className="mt-2 text-xs text-amber-400">{result.message}</p>
            ) : null}
            {progress.passed && !progress.codeModifiedSincePass ? (
              <p className="mt-2 text-xs text-emerald-400">
                This level is passed.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
