"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentSummaryDto } from "@/lib/api-types";
import { fetchJson } from "@/lib/client/api";

function levelChipClass(level: AssessmentSummaryDto["levels"][number]): string {
  if (level.passed) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
  }
  if (level.hasCode || level.lastRun || level.lastSubmit) {
    return "border-sky-500/40 bg-sky-500/10 text-sky-400";
  }
  return "border-slate-700 bg-slate-800/40 text-slate-400";
}

export default function AssessmentList({
  assessments,
}: {
  assessments: AssessmentSummaryDto[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function begin(id: string, mode: "practice" | "assessment") {
    setBusyId(id);
    setError(null);
    try {
      await fetchJson(`/api/assessments/${id}/start`, {
        method: "POST",
        body: JSON.stringify({ mode }),
      });
      router.push(`/assessments/${id}`);
    } catch (requestError) {
      setError((requestError as Error).message);
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header>
        <h1 className="text-xl font-semibold text-slate-100">
          Industry Coding Assessments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Local interview practice. No login, no cloud, everything stays on this machine.
        </p>
      </header>

      {error ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {assessments.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-slate-700 px-6 py-10 text-center text-sm text-slate-400">
          No assessments found. Add a package under{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5">assessments/</code> and
          restart the app.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {assessments.map((assessment) => {
            const busy = busyId === assessment.id;
            const hasSession = Boolean(assessment.session);
            return (
              <article
                key={assessment.id}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-5 transition-colors hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
                      {assessment.title}
                      {assessment.completed ? (
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-400">
                          Complete
                        </span>
                      ) : null}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {assessment.description}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {assessment.durationMinutes} min · {assessment.levelCount} levels
                      · JavaScript
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                      Progress
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-200">
                      {assessment.passedLevels} / {assessment.levelCount}
                    </div>
                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${
                            assessment.levelCount === 0
                              ? 0
                              : (assessment.passedLevels / assessment.levelCount) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {assessment.levels.map((level) => (
                    <span
                      key={level.number}
                      className={`rounded border px-2 py-0.5 text-xs ${levelChipClass(level)}`}
                    >
                      L{level.number} {level.passed ? "✓" : ""}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  {hasSession ? (
                    <>
                      <span className="mr-auto text-xs text-slate-500">
                        {assessment.session?.mode === "assessment"
                          ? "Assessment mode"
                          : "Practice mode"}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => router.push(`/assessments/${assessment.id}`)}
                        className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
                      >
                        Continue
                      </button>
                    </>
                  ) : assessment.started ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => begin(assessment.id, "assessment")}
                        className="rounded-md border border-slate-700 px-4 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
                      >
                        Start Assessment
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => router.push(`/assessments/${assessment.id}`)}
                        className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
                      >
                        Continue
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => begin(assessment.id, "practice")}
                        className="rounded-md border border-slate-700 px-4 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
                      >
                        Practice
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => begin(assessment.id, "assessment")}
                        className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
                      >
                        Start Assessment
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
