import Link from "next/link";
import type { EvalRunSummary } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function EvalRunsTable({ runs }: { runs: EvalRunSummary[] }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-xl bg-card p-8 text-center text-muted-foreground ring-1 ring-foreground/10">
        No eval runs yet — run tests/eval/run_eval.py to populate this page.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground">Started</TableHead>
            <TableHead className="text-muted-foreground">Direction</TableHead>
            <TableHead className="text-muted-foreground">Prompt version</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Pass rate</TableHead>
            <TableHead className="text-muted-foreground">Judge / Agent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell>
                <Link
                  href={`/evals/${encodeURIComponent(run.id)}`}
                  className="font-medium text-primary hover:text-primary-hover"
                >
                  {formatDateTime(run.startedAt)}
                </Link>
              </TableCell>
              <TableCell className="capitalize">{run.direction}</TableCell>
              <TableCell>
                <span className="font-mono text-xs">{run.promptVersion.label}</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({run.promptVersion.source})
                </span>
              </TableCell>
              <TableCell className="capitalize">{run.status.replace("_", " ")}</TableCell>
              <TableCell>
                {run.passRate != null ? (
                  <span
                    className={
                      run.passRate === 1
                        ? "text-status-ended-fg font-medium"
                        : run.passRate < 0.8
                          ? "text-status-error-fg font-medium"
                          : "font-medium"
                    }
                  >
                    {run.passCount}/{run.totalResults} ({Math.round(run.passRate * 100)}%)
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">
                {run.judgeModel} / {run.agentModel}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
