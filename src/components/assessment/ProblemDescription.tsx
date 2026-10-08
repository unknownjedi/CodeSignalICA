import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ProblemDescription({
  difficulty,
  timeoutMs,
  description,
}: {
  difficulty: string;
  timeoutMs: number;
  description: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
          {difficulty}
        </span>
        <span>timeout {timeoutMs} ms</span>
      </div>
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
      </div>
    </div>
  );
}
