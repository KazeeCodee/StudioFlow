import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardTone =
  | "violet"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "blue"
  | "orange";

type StatCardSize = "default" | "hero";

const toneClasses: Record<
  StatCardTone,
  { icon: string; heroBg: string; heroAccent: string }
> = {
  violet: {
    icon: "bg-primary/10 text-primary dark:bg-primary/20",
    heroBg: "from-primary/8 via-primary/4 to-transparent",
    heroAccent: "text-primary",
  },
  cyan: {
    icon: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
    heroBg: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    heroAccent: "text-cyan-600 dark:text-cyan-400",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    heroBg: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    heroAccent: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    heroBg: "from-amber-500/10 via-amber-500/5 to-transparent",
    heroAccent: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    icon: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
    heroBg: "from-rose-500/10 via-rose-500/5 to-transparent",
    heroAccent: "text-rose-600 dark:text-rose-400",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    heroBg: "from-blue-500/10 via-blue-500/5 to-transparent",
    heroAccent: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    icon: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    heroBg: "from-orange-500/10 via-orange-500/5 to-transparent",
    heroAccent: "text-orange-600 dark:text-orange-400",
  },
};

type StatCardProps = {
  label: string;
  value: number | string;
  suffix?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: StatCardTone;
  description?: string;
  size?: StatCardSize;
  breakdown?: ReactNode;
  className?: string;
};

export function StatCard({
  label,
  value,
  suffix = "",
  icon: Icon,
  tone = "violet",
  description,
  size = "default",
  breakdown,
  className,
}: StatCardProps) {
  const colors = toneClasses[tone];
  const displayValue = suffix ? `${value} ${suffix}` : String(value);
  const isHero = size === "hero";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/25",
        isHero ? "p-6" : "p-5",
        className,
      )}
    >
      {/* Subtle gradient corner */}
      <div
        className={cn(
          "pointer-events-none absolute rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-70",
          isHero
            ? "-right-8 -top-8 h-40 w-40 opacity-50"
            : "-right-4 -top-4 h-20 w-20 opacity-30 group-hover:opacity-50",
        )}
        style={{
          background: `radial-gradient(circle, currentColor 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {isHero && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-60",
            colors.heroBg,
          )}
          aria-hidden="true"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p
            className={cn(
              "font-semibold uppercase text-muted-foreground",
              isHero
                ? "text-xs tracking-[0.18em]"
                : "text-[11px] tracking-[0.14em]",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "font-bold tracking-tight tabular-nums text-foreground",
              isHero ? "text-5xl" : "text-3xl",
            )}
          >
            {displayValue}
          </p>
          {description && (
            <p
              className={cn(
                "text-muted-foreground",
                isHero ? "text-sm" : "text-xs",
              )}
            >
              {description}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl",
            colors.icon,
            isHero ? "h-12 w-12" : "h-10 w-10",
          )}
          aria-hidden="true"
        >
          <Icon className={isHero ? "h-6 w-6" : "h-5 w-5"} />
        </div>
      </div>

      {breakdown && (
        <div className="mt-5 border-t border-border/50 pt-4">{breakdown}</div>
      )}
    </div>
  );
}
