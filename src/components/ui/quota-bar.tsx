import { cn } from "@/lib/utils";

type QuotaBarProps = {
  used: number;
  total: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
};

function getBarColor(pct: number) {
  if (pct <= 10) return "bg-rose-500 dark:bg-rose-400";
  if (pct <= 30) return "bg-amber-500 dark:bg-amber-400";
  return "bg-primary";
}

function getLabelColor(pct: number) {
  if (pct <= 10) return "text-rose-600 dark:text-rose-400";
  if (pct <= 30) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

export function QuotaBar({
  used,
  total,
  className,
  showLabel = true,
  size = "md",
}: QuotaBarProps) {
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
  const barColor = getBarColor(pct);
  const labelColor = getLabelColor(pct);

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {remaining}
            </span>{" "}
            / {total} cupos restantes
          </p>
          <p className={cn("text-xs font-semibold tabular-nums", labelColor)}>
            {pct}%
          </p>
        </div>
      )}

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2",
        )}
        role="progressbar"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${remaining} de ${total} cupos restantes`}
      >
        <div
          className={cn("h-full rounded-full animate-fill transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
