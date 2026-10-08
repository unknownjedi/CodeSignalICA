"use client";

import { useEffect, useState } from "react";
import type { SessionDto } from "@/lib/api-types";

function formatRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export default function AssessmentTimer({ session }: { session: SessionDto | null }) {
  // `null` until mounted so the server-rendered markup (which must not depend on
  // the current time) matches the first client render and hydration succeeds.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Defer the first tick so it does not run synchronously during the effect
    // body (which would be flagged and can cause a cascading render).
    const immediate = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, []);

  if (!session || session.mode !== "assessment") {
    return <span className="text-xs text-slate-500">Practice mode</span>;
  }

  const durationMs = session.durationMinutes * 60_000;
  const remaining =
    now === null
      ? durationMs
      : new Date(session.startedAt).getTime() + durationMs - now;

  if (now !== null && remaining <= 0) {
    return (
      <span className="rounded bg-amber-500/15 px-2 py-1 text-xs font-medium text-amber-400">
        Time expired
      </span>
    );
  }

  return (
    <span
      className={`font-mono text-sm tabular-nums ${
        now !== null && remaining < 5 * 60_000 ? "text-amber-400" : "text-slate-200"
      }`}
      title="Time remaining"
    >
      {formatRemaining(remaining)}
    </span>
  );
}
