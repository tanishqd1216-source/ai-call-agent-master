import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvalRun } from "@/lib/api";
import { VerdictBadge } from "@/components/VerdictBadge";
import { formatDateTime } from "@/lib/format";

export default async function EvalRunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const run = await getEvalRun(runId);

  if (!run) {
    notFound();
  }

  const passCount = run.results.filter((r) => r.verdict === "PASS").length;
  const failCount = run.results.filter((r) => r.verdict === "FAIL").length;
  const errorCount = run.results.filter((r) => r.verdict === "ERROR").length;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/evals"
        className="text-sm text-muted-foreground hover:text-foreground w-fit flex items-center gap-1"
      >
        ← Back to evals
      </Link>

      <div className="rounded-xl border border-border bg-surface ring-1 ring-white/5 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Direction" value={<span className="capitalize">{run.direction}</span>} />
        <Field label="Prompt version" value={run.promptVersion.label} />
        <Field label="Prompt hash" value={<span className="font-mono text-xs">{run.promptVersion.promptHash.slice(0, 16)}…</span>} />
        <Field label="Source" value={run.promptVersion.source} />
        <Field label="Judge model" value={<span className="font-mono text-xs">{run.judgeModel}</span>} />
        <Field label="Agent model" value={<span className="font-mono text-xs">{run.agentModel}</span>} />
        <Field label="Started" value={formatDateTime(run.startedAt)} />
        <Field label="Result" value={`${passCount} PASS / ${failCount} FAIL / ${errorCount} ERROR`} />
      </div>

      <div>
        <h2 className="font-semibold tracking-tight mb-2">Cases ({run.results.length})</h2>
        {run.results.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface ring-1 ring-white/5 p-6 text-center text-muted-foreground">
            No results recorded for this run.
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {run.results.map((result) => (
              <li
                key={result.id}
                className="rounded-xl border border-border bg-surface ring-1 ring-white/5 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <VerdictBadge verdict={result.verdict} />
                    <span className="font-mono text-xs">{result.caseId}</span>
                    {result.caseType && (
                      <span className="text-xs text-muted-foreground">({result.caseType})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>{result.turnCount ?? "—"} turns</span>
                    <span>
                      {result.inputTokens ?? "—"}/{result.outputTokens ?? "—"} tok
                    </span>
                    <span>{result.latencyMs != null ? `${(result.latencyMs / 1000).toFixed(1)}s` : "—"}</span>
                  </div>
                </div>
                {result.violatedRules.length > 0 && (
                  <div className="mt-1 text-xs text-status-error-fg">
                    Violated: {result.violatedRules.join(", ")}
                  </div>
                )}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-primary hover:text-primary-hover">
                    View transcript &amp; judge reasoning
                  </summary>
                  <div className="mt-2 flex flex-col gap-2">
                    {result.judgeReasoning && (
                      <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-2 font-mono text-xs text-muted-foreground">
                        {formatJudgeReasoning(result.judgeReasoning)}
                      </pre>
                    )}
                    <pre className="whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-2 font-mono text-xs">
                      {result.transcript}
                    </pre>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function formatJudgeReasoning(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
