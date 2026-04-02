import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type StatCardTone =
  | "violet"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "blue"
  | "orange";

const toneClasses: Record<
  StatCardTone,
  { icon: string; value: string }
> = {
  violet: {
    icon: "bg-primary/10 text-primary dark:bg-primary/20",
    value: "",
  },
  cyan: {
    icon: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
    value: "",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    value: "",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    value: "",
  },
  rose: {
    icon: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
    value: "",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    value: "",
  },
  orange: {
    icon: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    value: "",
  },
};

type StatCardProps = {
  label: string;
  value: number | string;
  suffix?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: StatCardTone;
  description?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  suffix = "",
  icon: Icon,
  tone = "violet",
  description,
  className,
}: StatCardProps) {
  const colors = toneClasses[tone];
  const displayValue = suffix ? `${value} ${suffix}` : String(value);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5",
        "transition-shadow duration-200 hover:shadow-md hover:shadow-black/4 dark:hover:shadow-black/20",
        className,
      )}
    >
      {/* Subtle gradient corner */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity duration-300 group-hover:opacity-50"
        style={{
          background: `radial-gradient(circle, currentColor 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {displayValue}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            colors.icon,
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
