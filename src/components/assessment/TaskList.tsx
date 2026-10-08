"use client";

import type { AssessmentSummaryDto, LevelProgressDto } from "@/lib/api-types";

function statusIcon(level: LevelProgressDto, active: boolean) {
  if (level.passed) {
    return { symbol: "✓", className: "text-emerald-400" };
  }
  if (active) {
    return { symbol: "●", className: "text-sky-400" };
  }
  if (level.hasCode || level.lastRun || level.lastSubmit) {
    return { symbol: "◐", className: "text-slate-400" };
  }
  return { symbol: "○", className: "text-slate-600" };
}

export default function TaskList({
  assessment,
  activeLevel,
  onSelect,
  disabled,
}: {
  assessment: AssessmentSummaryDto;
  activeLevel: number;
  onSelect: (level: number) => void;
  disabled?: boolean;
}) {
  return (
    <ul className="space-y-0.5">
      {assessment.levels.map((level) => {
        const active = level.number === activeLevel;
        const icon = statusIcon(level, active);
        return (
          <li key={level.number}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(level.number)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] transition-colors disabled:opacity-60 ${
                active ? "bg-slate-700/60" : "hover:bg-slate-800/60"
              }`}
            >
              <span className={`w-3.5 text-center ${icon.className}`}>{icon.symbol}</span>
              <span
                className={`min-w-0 flex-1 truncate ${
                  active ? "font-medium text-slate-100" : "text-slate-300"
                }`}
              >
                {level.number}. {level.title}
              </span>
              {level.codeModifiedSincePass ? (
                <span className="text-amber-400" title="Code modified since last passing submission">
                  ⚠
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
