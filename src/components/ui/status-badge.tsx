import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Booking statuses ───────────────────────────────────────────────────────── */

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled_by_user"
  | "cancelled_by_admin"
  | "completed"
  | "no_show";

const bookingConfig: Record<
  BookingStatus,
  { label: string; dot: string; badge: string }
> = {
  pending: {
    label: "Pendiente",
    dot: "bg-amber-500",
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  },
  confirmed: {
    label: "Confirmada",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  completed: {
    label: "Completada",
    dot: "bg-blue-500",
    badge:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
  },
  no_show: {
    label: "No asistió",
    dot: "bg-orange-500",
    badge:
      "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300",
  },
  cancelled_by_user: {
    label: "Cancelada",
    dot: "bg-zinc-400",
    badge:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-600/40 dark:bg-zinc-500/10 dark:text-zinc-400",
  },
  cancelled_by_admin: {
    label: "Cancelada por staff",
    dot: "bg-rose-500",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
  },
};

type BookingStatusBadgeProps = {
  status: BookingStatus;
  withDot?: boolean;
  className?: string;
};

export function BookingStatusBadge({
  status,
  withDot = false,
  className,
}: BookingStatusBadgeProps) {
  const config = bookingConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.badge,
        className,
      )}
    >
      {withDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)}
          aria-hidden="true"
        />
      )}
      {config.label}
    </Badge>
  );
}

/* ─── Member statuses ────────────────────────────────────────────────────────── */

type MemberStatus = "active" | "inactive" | "suspended";

const memberConfig: Record<MemberStatus, { label: string; badge: string }> = {
  active: {
    label: "Activo",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  inactive: {
    label: "Inactivo",
    badge:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-600/40 dark:bg-zinc-500/10 dark:text-zinc-400",
  },
  suspended: {
    label: "Suspendido",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
  },
};

export function MemberStatusBadge({
  status,
  className,
}: {
  status: MemberStatus;
  className?: string;
}) {
  const config = memberConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.badge,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}

/* ─── Space statuses ─────────────────────────────────────────────────────────── */

type SpaceStatus = "active" | "inactive" | "maintenance";

const spaceConfig: Record<SpaceStatus, { label: string; badge: string }> = {
  active: {
    label: "Activo",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  inactive: {
    label: "Inactivo",
    badge:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-600/40 dark:bg-zinc-500/10 dark:text-zinc-400",
  },
  maintenance: {
    label: "Mantenimiento",
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

export function SpaceStatusBadge({
  status,
  className,
}: {
  status: SpaceStatus;
  className?: string;
}) {
  const config = spaceConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.badge,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}

/* ─── Plan statuses ──────────────────────────────────────────────────────────── */

type PlanStatus = "draft" | "active" | "inactive" | "archived";

const planConfig: Record<PlanStatus, { label: string; badge: string }> = {
  draft: {
    label: "Borrador",
    badge:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-600/40 dark:bg-zinc-500/10 dark:text-zinc-400",
  },
  active: {
    label: "Activo",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  inactive: {
    label: "Inactivo",
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  },
  archived: {
    label: "Archivado",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
  },
};

export function PlanStatusBadge({
  status,
  className,
}: {
  status: PlanStatus;
  className?: string;
}) {
  const config = planConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.badge,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
