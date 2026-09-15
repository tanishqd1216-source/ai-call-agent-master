"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { EvalRunSummary } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function EvalPassRateChart({ runs }: { runs: EvalRunSummary[] }) {
  // runs come in newest-first from the API; chart reads left-to-right chronologically.
  const data = [...runs]
    .filter((r) => r.passRate != null)
    .reverse()
    .map((r) => ({
      label: `${r.promptVersion.label} (${r.direction})`,
      startedAt: r.startedAt,
      passRatePct: Math.round((r.passRate ?? 0) * 100),
    }));

  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
        No completed eval runs yet to chart.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="mb-2 text-sm font-medium text-muted-foreground">Pass rate across runs</div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [`${value}%`, "Pass rate"] as [string, string]}
              labelFormatter={(_label, payload) =>
                payload?.[0]?.payload?.startedAt ? formatDateTime(payload[0].payload.startedAt) : ""
              }
            />
            <Line
              type="monotone"
              dataKey="passRatePct"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
