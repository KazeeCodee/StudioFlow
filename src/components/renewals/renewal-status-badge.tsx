import { AlertCircle, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RenewalUrgency } from "@/modules/renewals/status";

const statusConfig: Record<
  RenewalUrgency,
  { label: string; icon: typeof AlertCircle; className: string }
> = {
  overdue: {
    label: "Vencido",
    icon: AlertCircle,
    className: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  due_today: {
    label: "Vence hoy",
    icon: Clock3,
    className: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  due_soon: {
    label: "Vence pronto",
    icon: CalendarClock,
    className: "border-amber-500/20 bg-amber-500/8 text-amber-800 dark:text-amber-300",
  },
  future: {
    label: "Futuro",
    icon: CheckCircle2,
    className: "border-border bg-muted/60 text-muted-foreground",
  },
};

export function RenewalStatusBadge({ status }: { status: RenewalUrgency }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
