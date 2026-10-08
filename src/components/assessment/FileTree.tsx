"use client";

import type { WorkspaceFileRefDto } from "@/lib/api-types";

interface TreeNode {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  file?: WorkspaceFileRefDto;
}

function buildTree(files: WorkspaceFileRefDto[]): TreeNode {
  const root: TreeNode = { name: "", path: "", children: new Map() };
  for (const file of files) {
    const segments = file.path.split("/");
    let node = root;
    segments.forEach((segment, index) => {
      const isLeaf = index === segments.length - 1;
      const path = segments.slice(0, index + 1).join("/");
      if (!node.children.has(segment)) {
        node.children.set(segment, { name: segment, path, children: new Map() });
      }
      node = node.children.get(segment)!;
      if (isLeaf) {
        node.file = file;
      }
    });
  }
  return root;
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3Zm-2 5V4a2 2 0 1 1 4 0v2H6Z"
      />
    </svg>
  );
}

function FileRow({
  file,
  active,
  onClick,
}: {
  file: WorkspaceFileRefDto;
  active: boolean;
  onClick: (path: string) => void;
}) {
  const name = file.path.split("/").pop() ?? file.path;
  return (
    <button
      type="button"
      onClick={() => onClick(file.path)}
      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] transition-colors ${
        active
          ? "bg-slate-700/60 text-slate-100"
          : "text-slate-300 hover:bg-slate-800/60"
      }`}
      title={file.editable ? file.path : `${file.path} (read-only)`}
    >
      <span className={file.editable ? "text-sky-400" : "text-slate-500"}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4.5 1A1.5 1.5 0 0 0 3 2.5v11A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5V5.5L9.5 1h-5Zm4.5 1.5L11.5 5H9V2.5Z"
          />
        </svg>
      </span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {file.editable ? null : (
        <span className="text-amber-400" title="Read-only file">
          <LockIcon />
        </span>
      )}
    </button>
  );
}

function DirectoryNode({
  node,
  activePath,
  onSelect,
  depth,
}: {
  node: TreeNode;
  activePath: string | null;
  onSelect: (path: string) => void;
  depth: number;
}) {
  const children = [...node.children.values()].sort((a, b) => {
    if (Boolean(a.file) !== Boolean(b.file)) return a.file ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  if (node.file) {
    return <FileRow file={node.file} active={activePath === node.path} onClick={onSelect} />;
  }

  return (
    <div>
      {node.name ? (
        <div
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.name}
        </div>
      ) : null}
      <div>
        {children.map((child) => (
          <DirectoryNode
            key={child.path}
            node={child}
            activePath={activePath}
            onSelect={onSelect}
            depth={node.name ? depth + 1 : depth}
          />
        ))}
      </div>
    </div>
  );
}

export default function FileTree({
  files,
  activePath,
  onSelect,
}: {
  files: WorkspaceFileRefDto[];
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  const tree = buildTree(files);
  return (
    <div className="space-y-0.5">
      <DirectoryNode node={tree} activePath={activePath} onSelect={onSelect} depth={0} />
    </div>
  );
}
