import { listEvalRuns, getEvalRun } from "@/lib/api";
import { CompareRunPicker } from "@/components/CompareRunPicker";
import { VerdictBadge } from "@/components/VerdictBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SearchParams = Promise<{ a?: string; b?: string }>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const { a, b } = await searchParams;
  const { runs } = await listEvalRuns({ limit: 100 });

  const [runA, runB] = await Promise.all([
    a ? getEvalRun(a) : Promise.resolve(null),
    b ? getEvalRun(b) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Compare eval runs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pick two runs of the same golden set (e.g. the current prompt vs. a variant) to see
          which cases flip.
        </p>
      </div>

      <CompareRunPicker runs={runs} initialA={a} initialB={b} />

      {runA && runB ? (
        <ComparisonView runA={runA} runB={runB} />
      ) : (
        <div className="rounded-xl bg-card p-8 text-center text-muted-foreground ring-1 ring-foreground/10">
          Select two runs above to compare.
        </div>
      )}
    </div>
  );
}

function ComparisonView({
  runA,
  runB,
}: {
  runA: NonNullable<Awaited<ReturnType<typeof getEvalRun>>>;
  runB: NonNullable<Awaited<ReturnType<typeof getEvalRun>>>;
}) {
  const resultsByCase = new Map<string, { a?: (typeof runA.results)[number]; b?: (typeof runB.results)[number] }>();
  for (const r of runA.results) resultsByCase.set(r.caseId, { a: r });
  for (const r of runB.results) {
    const existing = resultsByCase.get(r.caseId) ?? {};
    existing.b = r;
    resultsByCase.set(r.caseId, existing);
  }

  const rows = [...resultsByCase.entries()].sort(([caseIdA], [caseIdB]) => caseIdA.localeCompare(caseIdB));
  const flipped = rows.filter(([, r]) => r.a && r.b && r.a.verdict !== r.b.verdict);

  const passRateA = runA.results.length
    ? runA.results.filter((r) => r.verdict === "PASS").length / runA.results.length
    : null;
  const passRateB = runB.results.length
    ? runB.results.filter((r) => r.verdict === "PASS").length / runB.results.length
    : null;
  const delta = passRateA != null && passRateB != null ? passRateB - passRateA : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label={`A: ${runA.promptVersion.label}`} passRate={passRateA} />
        <SummaryCard label={`B: ${runB.promptVersion.label}`} passRate={passRateB} />
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="text-xs text-muted-foreground">Pass rate delta (B − A)</div>
          <div
            className={
              "text-2xl font-semibold tracking-tight " +
              (delta == null ? "" : delta > 0 ? "text-status-ended-fg" : delta < 0 ? "text-status-error-fg" : "")
            }
          >
            {delta != null ? `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}%` : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{flipped.length} case(s) flipped</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Case</TableHead>
              <TableHead className="text-muted-foreground">A verdict</TableHead>
              <TableHead className="text-muted-foreground">B verdict</TableHead>
              <TableHead className="text-muted-foreground">Changed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([caseId, { a: ra, b: rb }]) => {
              const changed = !!ra && !!rb && ra.verdict !== rb.verdict;
              return (
                <TableRow key={caseId}>
                  <TableCell className="font-mono text-xs">{caseId}</TableCell>
                  <TableCell>{ra ? <VerdictBadge verdict={ra.verdict} /> : "—"}</TableCell>
                  <TableCell>{rb ? <VerdictBadge verdict={rb.verdict} /> : "—"}</TableCell>
                  <TableCell>
                    {changed ? (
                      <span className="text-status-error-fg font-medium">changed</span>
                    ) : (
                      <span className="text-muted-foreground">same</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SummaryCard({ label, passRate }: { label: string; passRate: number | null }) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="text-xs text-muted-foreground truncate" title={label}>
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight">
        {passRate != null ? `${Math.round(passRate * 100)}%` : "—"}
      </div>
    </div>
  );
}
