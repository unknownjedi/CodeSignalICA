"use client";

import dynamic from "next/dynamic";
import type { MonacoEditorProps } from "./MonacoEditorInner";

const MonacoEditorInner = dynamic(() => import("./MonacoEditorInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      Loading editor…
    </div>
  ),
});

export default function CodeEditor(props: MonacoEditorProps) {
  return (
    <div className="h-full w-full">
      <MonacoEditorInner {...props} />
    </div>
  );
}
