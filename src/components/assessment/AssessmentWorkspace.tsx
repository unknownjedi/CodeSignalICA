"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  AssessmentSummaryDto,
  CodeResponseDto,
  ExecuteResponseDto,
  FileMapDto,
  LevelDetailDto,
} from "@/lib/api-types";
import { fetchJson } from "@/lib/client/api";
import TaskList from "./TaskList";
import FileTree, { LockIcon } from "./FileTree";
import ProblemDescription from "./ProblemDescription";
import CodeEditor from "./CodeEditor";
import TestResults from "./TestResults";
import AssessmentTimer from "./AssessmentTimer";

type SaveState = "idle" | "saving" | "saved" | "error";

interface LevelState {
  detail: LevelDetailDto;
  files: FileMapDto;
  openFiles: string[];
  activeFile: string;
  warning?: string;
  added?: string[];
  runResult: ExecuteResponseDto | null;
  submitResult: ExecuteResponseDto | null;
  saveState: SaveState;
}

interface Props {
  summary: AssessmentSummaryDto;
  initialLevel: number;
  initialDetail: LevelDetailDto;
  initialCode: CodeResponseDto;
}

const SAVE_DEBOUNCE_MS = 800;

function editableIn(detail: LevelDetailDto, path: string): boolean {
  return detail.workspace.files.find((file) => file.path === path)?.editable ?? false;
}

function initialLevelState(
  detail: LevelDetailDto,
  code: CodeResponseDto
): LevelState {
  const entry =
    code.files[detail.workspace.entry] !== undefined
      ? detail.workspace.entry
      : Object.keys(code.files)[0] ?? detail.workspace.entry;
  return {
    detail,
    files: code.files,
    openFiles: entry ? [entry] : [],
    activeFile: entry,
    warning: code.warning,
    added: code.added,
    runResult: null,
    submitResult: null,
    saveState: "idle",
  };
}

export default function AssessmentWorkspace({
  summary: initialSummary,
  initialLevel,
  initialDetail,
  initialCode,
}: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [activeLevel, setActiveLevel] = useState(initialLevel);
  const [levels, setLevels] = useState<Record<number, LevelState>>({
    [initialLevel]: initialLevelState(initialDetail, initialCode),
  });
  const [rightTab, setRightTab] = useState<"description" | "tests">("description");
  const [loadingLevel, setLoadingLevel] = useState(false);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const activeLevelRef = useRef(activeLevel);
  const levelsRef = useRef(levels);
  const busyRef = useRef(busy);
  const activeFileRef = useRef<Record<number, string>>({ [initialLevel]: levels[initialLevel].activeFile });

  useEffect(() => {
    activeLevelRef.current = activeLevel;
    activeFileRef.current[activeLevel] = levels[activeLevel]?.activeFile ?? "";
  }, [activeLevel, levels]);

  useEffect(() => {
    levelsRef.current = levels;
  }, [levels]);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const saveTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const saveQueues = useRef(new Map<number, Promise<void>>());

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const refreshProgress = useCallback(async () => {
    const progress = await fetchJson<AssessmentSummaryDto>(
      `/api/assessments/${summary.id}/progress`
    );
    setSummary(progress);
    setLevels((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(next)) {
        const number = Number(key);
        const levelProgress = progress.levels.find((level) => level.number === number);
        if (levelProgress && next[number]) {
          next[number] = {
            ...next[number],
            detail: { ...next[number].detail, progress: levelProgress },
          };
        }
      }
      return next;
    });
  }, [summary.id]);

  // Saves are serialized per level. Each queued task reads the latest files at the
  // moment it runs, so an older request can never overwrite newer edits.
  const persistLevel = useCallback(
    (levelNumber: number): Promise<void> => {
      const previous = saveQueues.current.get(levelNumber) ?? Promise.resolve();
      const task = previous
        .catch(() => {})
        .then(async () => {
          const state = levelsRef.current[levelNumber];
          if (!state) return;
          setLevels((prev) =>
            prev[levelNumber]
              ? { ...prev, [levelNumber]: { ...prev[levelNumber], saveState: "saving" } }
              : prev
          );
          try {
            const response = await fetchJson<{ codeModifiedSincePass: boolean }>(
              `/api/assessments/${summary.id}/code/${levelNumber}`,
              { method: "PUT", body: JSON.stringify({ files: state.files }) }
            );
            setLevels((prev) =>
              prev[levelNumber]
                ? { ...prev, [levelNumber]: { ...prev[levelNumber], saveState: "saved" } }
                : prev
            );
            setSummary((prev) => ({
              ...prev,
              started: true,
              levels: prev.levels.map((level) =>
                level.number === levelNumber
                  ? {
                      ...level,
                      hasCode: true,
                      codeModifiedSincePass: response.codeModifiedSincePass,
                    }
                  : level
              ),
            }));
          } catch (requestError) {
            setLevels((prev) =>
              prev[levelNumber]
                ? { ...prev, [levelNumber]: { ...prev[levelNumber], saveState: "error" } }
                : prev
            );
            setError((requestError as Error).message);
          }
        });
      saveQueues.current.set(levelNumber, task);
      return task;
    },
    [summary.id]
  );

  const scheduleSave = useCallback(
    (levelNumber: number) => {
      const existing = saveTimers.current.get(levelNumber);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        saveTimers.current.delete(levelNumber);
        void persistLevel(levelNumber);
      }, SAVE_DEBOUNCE_MS);
      saveTimers.current.set(levelNumber, timer);
    },
    [persistLevel]
  );

  const saveNow = useCallback(() => {
    const levelNumber = activeLevelRef.current;
    const existing = saveTimers.current.get(levelNumber);
    if (existing) {
      clearTimeout(existing);
      saveTimers.current.delete(levelNumber);
    }
    void persistLevel(levelNumber);
  }, [persistLevel]);

  const loadLevel = useCallback(
    async (levelNumber: number) => {
      if (levelsRef.current[levelNumber]) {
        setActiveLevel(levelNumber);
        setNoticeDismissed(false);
        void fetchJson<LevelDetailDto>(
          `/api/assessments/${summary.id}/levels/${levelNumber}`
        )
          .then((detail) => {
            setLevels((previous) =>
              previous[levelNumber]
                ? { ...previous, [levelNumber]: { ...previous[levelNumber], detail } }
                : previous
            );
          })
          .catch(() => {});
        return;
      }
      setLoadingLevel(true);
      setError(null);
      try {
        const [detail, code] = await Promise.all([
          fetchJson<LevelDetailDto>(`/api/assessments/${summary.id}/levels/${levelNumber}`),
          fetchJson<CodeResponseDto>(`/api/assessments/${summary.id}/code/${levelNumber}`),
        ]);
        setLevels((previous) => ({
          ...previous,
          [levelNumber]: initialLevelState(detail, code),
        }));
        setActiveLevel(levelNumber);
        setRightTab("description");
        setNoticeDismissed(false);
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoadingLevel(false);
      }
    },
    [summary.id]
  );

  const handleEditorChange = useCallback(
    (value: string) => {
      const levelNumber = activeLevelRef.current;
      const filePath = activeFileRef.current[levelNumber];
      const state = levelsRef.current[levelNumber];
      if (!state || !filePath || !editableIn(state.detail, filePath)) {
        return;
      }
      setLevels((previous) =>
        previous[levelNumber]
          ? {
              ...previous,
              [levelNumber]: {
                ...previous[levelNumber],
                files: { ...previous[levelNumber].files, [filePath]: value },
                saveState: "idle",
              },
            }
          : previous
      );
      scheduleSave(levelNumber);
    },
    [scheduleSave]
  );

  const openFile = useCallback((levelNumber: number, filePath: string) => {
    setLevels((previous) => {
      const state = previous[levelNumber];
      if (!state) return previous;
      const openFiles = state.openFiles.includes(filePath)
        ? state.openFiles
        : [...state.openFiles, filePath];
      return {
        ...previous,
        [levelNumber]: { ...state, openFiles, activeFile: filePath },
      };
    });
  }, []);

  const closeFile = useCallback((levelNumber: number, filePath: string) => {
    setLevels((previous) => {
      const state = previous[levelNumber];
      if (!state) return previous;
      const openFiles = state.openFiles.filter((path) => path !== filePath);
      const activeFile =
        state.activeFile === filePath ? (openFiles[openFiles.length - 1] ?? "") : state.activeFile;
      return {
        ...previous,
        [levelNumber]: { ...state, openFiles, activeFile },
      };
    });
  }, []);

  const execute = useCallback(
    async (type: "run" | "submit") => {
      const levelNumber = activeLevelRef.current;
      if (!levelsRef.current[levelNumber] || busyRef.current) return;
      setBusy(type);
      setError(null);
      setRightTab("tests");

      // Flush any pending autosave first so it cannot land after the execution
      // request and overwrite the code that was actually run.
      const pendingTimer = saveTimers.current.get(levelNumber);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        saveTimers.current.delete(levelNumber);
        await persistLevel(levelNumber);
      }
      await (saveQueues.current.get(levelNumber) ?? Promise.resolve());

      const state = levelsRef.current[levelNumber];
      if (!state) {
        setBusy(null);
        return;
      }

      try {
        const response = await fetchJson<ExecuteResponseDto>(
          `/api/assessments/${summary.id}/${type}`,
          { method: "POST", body: JSON.stringify({ level: levelNumber, files: state.files }) }
        );
        setLevels((previous) =>
          previous[levelNumber]
            ? {
                ...previous,
                [levelNumber]: {
                  ...previous[levelNumber],
                  saveState: "saved",
                  runResult: type === "run" ? response : previous[levelNumber].runResult,
                  submitResult:
                    type === "submit" ? response : previous[levelNumber].submitResult,
                },
              }
            : previous
        );
        await refreshProgress();
        if (type === "submit" && response.assessmentCompleted) {
          setCompletionDismissed(false);
        }
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [persistLevel, refreshProgress, summary.id]
  );

  const runTests = useCallback(() => void execute("run"), [execute]);
  const submit = useCallback(() => void execute("submit"), [execute]);

  const active = levels[activeLevel];
  const progress = active?.detail.progress;
  const activeFile = active?.activeFile ?? "";
  const activeFileEditable = active ? editableIn(active.detail, activeFile) : false;
  const canRun = Boolean(active) && busy === null;

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="text-slate-400 transition-colors hover:text-slate-100" title="Back">
            ←
          </Link>
          <span className="truncate text-sm font-medium text-slate-100">{summary.title}</span>
          {active ? (
            <span className="truncate rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              Level {activeLevel}: {active.detail.title}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          {active ? (
            <span className="text-[11px] text-slate-500">
              {active.saveState === "saving"
                ? "Saving…"
                : active.saveState === "saved"
                  ? "Saved"
                  : active.saveState === "error"
                    ? "Save failed"
                    : ""}
            </span>
          ) : null}
          <AssessmentTimer session={summary.session} />
        </div>
      </header>

      {error ? (
        <div className="flex items-center justify-between border-b border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          <span>{error}</span>
          <button type="button" className="text-xs text-red-300/70 hover:text-red-200" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {summary.completed && !completionDismissed ? (
        <div className="flex items-center justify-between border-b border-emerald-500/40 bg-emerald-500/10 px-4 py-2">
          <span className="text-sm text-emerald-300">
            Assessment Complete — {summary.passedLevels} / {summary.levelCount} levels passed
          </span>
          <button
            type="button"
            onClick={() => setCompletionDismissed(true)}
            className="rounded border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/10"
          >
            Review Assessment
          </button>
        </div>
      ) : null}

      {progress?.codeModifiedSincePass && !noticeDismissed ? (
        <div className="flex items-center justify-between border-b border-amber-500/40 bg-amber-500/10 px-4 py-1.5">
          <span className="text-xs text-amber-300">
            Code modified since last passing submission.
          </span>
          <button
            type="button"
            disabled={busy !== null}
            onClick={submit}
            className="rounded border border-amber-500/40 px-2.5 py-0.5 text-xs text-amber-300 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
          >
            Submit Again
          </button>
        </div>
      ) : null}

      {active && (active.warning || (active.added && active.added.length > 0)) && !noticeDismissed ? (
        <div className="flex items-center justify-between border-b border-sky-500/30 bg-sky-500/10 px-4 py-1.5">
          <span className="text-xs text-sky-300">
            {active.warning ??
              `New methods were added from the level starter: ${active.added?.join(", ")}`}
          </span>
          <button type="button" className="text-xs text-sky-300/70 hover:text-sky-200" onClick={() => setNoticeDismissed(true)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {/* Left: tasks + files */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/60">
          <div className="border-b border-slate-800 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tasks</div>
            <div className="mt-1">
              <TaskList
                assessment={summary}
                activeLevel={activeLevel}
                onSelect={(level) => void loadLevel(level)}
                disabled={loadingLevel}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Files
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {active ? (
                <FileTree
                  files={active.detail.workspace.files}
                  activePath={activeFile}
                  onSelect={(path) => openFile(activeLevel, path)}
                />
              ) : null}
            </div>
          </div>
        </aside>

        {/* Center: editor */}
        <main className="flex min-w-0 flex-1 flex-col">
          {active ? (
            <>
              <div className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-slate-800 bg-slate-950">
                {active.openFiles.map((path) => {
                  const name = path.split("/").pop() ?? path;
                  const isActive = path === activeFile;
                  const editable = editableIn(active.detail, path);
                  return (
                    <div
                      key={path}
                      className={`group flex items-center gap-2 border-r border-slate-800 px-3 text-xs ${
                        isActive ? "bg-slate-900 text-slate-100" : "text-slate-400 hover:bg-slate-900/50"
                      }`}
                    >
                      <button type="button" onClick={() => openFile(activeLevel, path)} className="flex items-center gap-1.5">
                        {editable ? null : (
                          <span className="text-amber-400">
                            <LockIcon />
                          </span>
                        )}
                        <span>{name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => closeFile(activeLevel, path)}
                        className="text-slate-600 opacity-0 transition-opacity hover:text-slate-300 group-hover:opacity-100"
                        title="Close"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                <div className="flex flex-1 items-center justify-end pr-3">
                  {activeFile ? (
                    <span className={`text-[11px] ${activeFileEditable ? "text-slate-500" : "text-amber-400"}`}>
                      {activeFileEditable ? activeFile : `${activeFile} · read-only`}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="min-h-0 flex-1">
                {activeFile ? (
                  <CodeEditor
                    value={active.files[activeFile] ?? ""}
                    path={`${summary.id}/level-${activeLevel}/${activeFile}`}
                    readOnly={!activeFileEditable}
                    onChange={handleEditorChange}
                    onSave={saveNow}
                    onRun={runTests}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Open a file to start coding.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              {loadingLevel ? "Loading level…" : "Select a task"}
            </div>
          )}
        </main>

        {/* Right: description / tests */}
        <aside className="flex w-[26rem] shrink-0 flex-col border-l border-slate-800 bg-slate-950/60">
          <div className="flex h-9 shrink-0 items-stretch border-b border-slate-800">
            <button
              type="button"
              onClick={() => setRightTab("description")}
              className={`px-4 text-xs font-medium transition-colors ${
                rightTab === "description"
                  ? "border-b-2 border-sky-500 text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setRightTab("tests")}
              className={`px-4 text-xs font-medium transition-colors ${
                rightTab === "tests"
                  ? "border-b-2 border-sky-500 text-slate-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tests
            </button>
          </div>

          {active ? (
            rightTab === "description" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ProblemDescription
                  difficulty={active.detail.difficulty}
                  timeoutMs={active.detail.timeoutMs}
                  description={active.detail.description}
                />
              </div>
            ) : (
              <TestResults
                publicTests={active.detail.publicTests}
                hiddenTestCount={active.detail.hiddenTestCount}
                runResult={active.runResult}
                submitResult={active.submitResult}
                progress={active.detail.progress}
                testMetaError={active.detail.testMetaError}
              />
            )
          ) : null}

          <div className="flex shrink-0 gap-2 border-t border-slate-800 p-3">
            <button
              type="button"
              disabled={!canRun}
              onClick={runTests}
              className="flex-1 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800/60 disabled:opacity-50"
            >
              {busy === "run" ? "Running…" : "Run Tests"}
            </button>
            <button
              type="button"
              disabled={!canRun}
              onClick={submit}
              className="flex-1 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
            >
              {busy === "submit" ? "Submitting…" : "Submit"}
            </button>
          </div>
          <div className="shrink-0 px-3 pb-2 text-center text-[11px] text-slate-600">
            Cmd/Ctrl+S save · Cmd/Ctrl+Enter run
          </div>
        </aside>
      </div>
    </div>
  );
}
