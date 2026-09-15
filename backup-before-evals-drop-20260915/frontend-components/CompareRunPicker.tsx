"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EvalRunSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const labelClass = "flex flex-col text-xs font-medium text-muted-foreground gap-1";

function runLabel(run: EvalRunSummary): string {
  const pct = run.passRate != null ? `${Math.round(run.passRate * 100)}%` : "—";
  return `${run.direction} / ${run.promptVersion.label} (${pct})`;
}

export function CompareRunPicker({
  runs,
  initialA,
  initialB,
}: {
  runs: EvalRunSummary[];
  initialA?: string;
  initialB?: string;
}) {
  const router = useRouter();
  const [a, setA] = useState(initialA ?? "");
  const [b, setB] = useState(initialB ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) return;
    router.push(`/evals/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
    >
      <label className={labelClass}>
        Run A (baseline)
        <Select value={a} onValueChange={setA}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a run" />
          </SelectTrigger>
          <SelectContent>
            {runs.map((run) => (
              <SelectItem key={run.id} value={run.id}>
                {runLabel(run)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className={labelClass}>
        Run B (compare against)
        <Select value={b} onValueChange={setB}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a run" />
          </SelectTrigger>
          <SelectContent>
            {runs.map((run) => (
              <SelectItem key={run.id} value={run.id}>
                {runLabel(run)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <Button type="submit" size="sm" disabled={!a || !b}>
        Compare
      </Button>
    </form>
  );
}
