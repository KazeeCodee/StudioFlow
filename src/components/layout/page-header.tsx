import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  statusLabel?: string;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  statusLabel,
}: PageHeaderProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

        {statusLabel ? (
          <Badge
            variant="outline"
            className="w-fit rounded-full border-amber-300/70 bg-amber-100/70 px-3 py-1 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            {statusLabel}
          </Badge>
        ) : null}
      </div>
    </section>
  );
}
