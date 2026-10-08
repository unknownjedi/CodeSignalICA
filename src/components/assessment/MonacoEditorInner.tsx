"use client";

import { useEffect, useRef } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";

loader.config({ paths: { vs: "/monaco/vs" } });

export interface MonacoEditorProps {
  value: string;
  path: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onRun: () => void;
}

export default function MonacoEditorInner({
  value,
  path,
  readOnly = false,
  onChange,
  onSave,
  onRun,
}: MonacoEditorProps) {
  const saveRef = useRef(onSave);
  const runRef = useRef(onRun);

  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    runRef.current = onRun;
  }, [onRun]);

  const handleMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveRef.current();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runRef.current();
    });
    editor.focus();
  };

  return (
    <Editor
      height="100%"
      language="javascript"
      theme="vs-dark"
      value={value}
      path={path}
      onChange={(next) => onChange(next ?? "")}
      onMount={handleMount}
      options={{
        readOnly,
        domReadOnly: readOnly,
        fontSize: 13,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        renderWhitespace: "selection",
        fixedOverflowWidgets: true,
        padding: { top: 10 },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
    />
  );
}
