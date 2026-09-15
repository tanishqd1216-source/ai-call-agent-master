import Link from "next/link";
import { listEvalRuns } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { EvalRunsTable } from "@/components/EvalRunsTable";
import { EvalPassRateChart } from "@/components/EvalPassRateChart";

export default async function EvalsPage() {
  const { runs, total } = await listEvalRuns({ limit: 50 });

  const completedRuns = runs.filter((r) => r.passRate != null);
  const latestPassRate = completedRuns[0]?.passRate ?? null;
  const bestRun = completedRuns.reduce<typeof completedRuns[number] | null>((best, r) => {
    if (!best || (r.passRate ?? 0) > (best.passRate ?? 0)) return r;
    return best;
  }, null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Evals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Golden-set runs graded by an LLM judge against the calling agent&apos;s own business
          rules. Populated by{" "}
          <code className="font-mono text-xs">tests/eval/run_eval.py</code>.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total runs" value={String(total)} />
        <StatCard
          label="Latest pass rate"
          value={latestPassRate != null ? `${Math.round(latestPassRate * 100)}%` : "—"}
        />
        <StatCard
          label="Best version"
          value={bestRun ? bestRun.promptVersion.label : "—"}
        />
        <StatCard
          label="Best pass rate"
          value={bestRun?.passRate != null ? `${Math.round(bestRun.passRate * 100)}%` : "—"}
        />
      </div>

      <EvalPassRateChart runs={runs} />

      <EvalRunsTable runs={runs} />

      <p className="text-sm text-muted-foreground">
        Showing {runs.length} of {total} runs.{" "}
        <Link
          href="/evals/compare"
          className="text-primary hover:text-primary-hover font-medium underline"
        >
          Compare two runs
        </Link>
        .
      </p>
    </div>
  );
}
