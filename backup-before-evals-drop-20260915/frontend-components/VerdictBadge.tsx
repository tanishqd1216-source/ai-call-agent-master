import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Reuses the existing status color tokens (StatusBadge.tsx) rather than adding new
// ones: PASS -> ended (green), FAIL -> error (red), ERROR -> in-progress (blue,
// as a neutral "grading failed, not a real verdict" signal).
const STYLES: Record<string, string> = {
  PASS: "bg-status-ended-bg text-status-ended-fg",
  FAIL: "bg-status-error-bg text-status-error-fg",
  ERROR: "bg-status-in-progress-bg text-status-in-progress-fg",
};

export function VerdictBadge({ verdict }: { verdict: string }) {
  const style = STYLES[verdict] ?? "bg-muted text-muted-foreground";
  return (
    <Badge variant="secondary" className={cn(style)}>
      {verdict}
    </Badge>
  );
}
