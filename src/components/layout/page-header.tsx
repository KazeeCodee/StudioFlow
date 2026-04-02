type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  statusLabel?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  statusLabel,
  actions,
}: PageHeaderProps) {
  return (
    <header className="space-y-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">
              {eyebrow}
            </p>
          )}

          <div className="flex items-start gap-3">
            <div className="mt-1.5 hidden h-6 w-0.5 shrink-0 rounded-full bg-primary sm:block" aria-hidden="true" />
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance leading-snug">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {statusLabel && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary dark:border-primary/25 dark:bg-primary/15">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
              {statusLabel}
            </div>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}
