import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  CreditCard,
  Users,
  WalletCards,
  CalendarDays,
  MapPinned,
  Plus,
  TrendingUp,
} from "lucide-react";
import { formatStudioDayMonth, formatStudioTime } from "@/lib/datetime";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminDashboardData } from "@/modules/dashboard/queries";

type AdminDashboardProps = {
  data: AdminDashboardData;
};

type BookingStatus = AdminDashboardData["todayAgenda"][number]["status"];

export function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      {/* ── Metric cards ──────────────────────────────────────────────────── */}
      <section aria-label="Métricas principales" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        <StatCard
          label="Reservas hoy"
          value={data.metrics.bookingsToday}
          icon={CalendarClock}
          tone="cyan"
        />
        <StatCard
          label="Horas esta semana"
          value={data.metrics.bookedHoursThisWeek}
          suffix="h"
          icon={Clock3}
          tone="emerald"
        />
        <StatCard
          label="Miembros activos"
          value={data.metrics.activeMembers}
          icon={Users}
          tone="violet"
        />
        <StatCard
          label="Renovaciones próximas"
          value={data.metrics.upcomingRenewals}
          icon={CreditCard}
          tone="amber"
          description={data.metrics.upcomingRenewals > 0 ? "Requieren seguimiento" : undefined}
        />
        <StatCard
          label="Cupos críticos"
          value={data.metrics.lowQuotaPlans}
          icon={WalletCards}
          tone="rose"
          description={data.metrics.lowQuotaPlans > 0 ? "Por debajo del umbral" : undefined}
        />
      </section>

      {/* ── Agenda + Quick actions ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Today's agenda */}
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Agenda de hoy</CardTitle>
                <CardDescription className="mt-0.5 text-sm">
                  Reservas activas del día con su franja, espacio y cupos.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-lg shrink-0">
                <Link href="/admin/calendar">
                  Ver agenda <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.todayAgenda.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-5 w-5" />}
                title="Sin reservas hoy"
                description="No hay reservas activas para el día de hoy."
                size="sm"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-none bg-muted/30 hover:bg-muted/30">
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wide">Horario</TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wide">Miembro</TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wide">Espacio</TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wide">Estado</TableHead>
                    <TableHead className="py-3 text-right text-xs font-semibold uppercase tracking-wide">Cupos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.todayAgenda.map((item) => (
                    <TableRow
                      key={item.id}
                      className="group border-border/40 transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="py-3 font-mono text-sm tabular-nums text-muted-foreground">
                        {formatStudioTime(item.startsAt)} – {formatStudioTime(item.endsAt)}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-medium text-foreground">{item.memberName}</span>
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">{item.spaceName}</TableCell>
                      <TableCell className="py-3">
                        <BookingStatusBadge status={item.status as BookingStatus} withDot />
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                          {item.quotaConsumed}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base font-semibold">Accesos rápidos</CardTitle>
            <CardDescription className="mt-0.5 text-sm">
              Acciones frecuentes de un vistazo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <Button
              asChild
              className="w-full justify-between rounded-xl px-4 py-2.5 text-sm"
            >
              <Link href="/admin/bookings/new">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Crear reserva
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-between rounded-xl px-4 py-2.5 text-sm"
            >
              <Link href="/admin/calendar">
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Abrir calendario
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-between rounded-xl px-4 py-2.5 text-sm"
            >
              <Link href="/admin/renewals">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Renovaciones
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-between rounded-xl px-4 py-2.5 text-sm"
            >
              <Link href="/admin/spaces">
                <span className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4" />
                  Gestionar espacios
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Usage + Cancellations ─────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Space usage */}
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
              <div>
                <CardTitle className="text-base font-semibold">Uso por espacio</CardTitle>
                <CardDescription className="mt-0.5 text-sm">
                  Distribución de horas reservadas esta semana.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {data.spaceUsage.length === 0 ? (
              <EmptyState
                icon={<MapPinned className="h-5 w-5" />}
                title="Sin actividad esta semana"
                description="Todavía no hay horas reservadas en la semana actual."
                size="sm"
              />
            ) : (
              data.spaceUsage.map((item) => (
                <div key={item.spaceId} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.spaceName}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {item.bookedHours}h
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary tabular-nums">
                        {item.sharePercentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary animate-fill transition-all duration-700"
                      style={{ width: `${Math.min(item.sharePercentage, 100)}%` }}
                      role="presentation"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      {item.sharePercentage}% del total semanal
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      {item.quotaConsumed} cupos consumidos
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent cancellations */}
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base font-semibold">Cancelaciones recientes</CardTitle>
            <CardDescription className="mt-0.5 text-sm">
              Últimos movimientos cancelados para detectar huecos operativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {data.recentCancellations.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-5 w-5" />}
                title="Sin cancelaciones recientes"
                description="No se registraron cancelaciones en el período."
                size="sm"
              />
            ) : (
              data.recentCancellations.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.memberName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {item.spaceName} · {formatStudioDayMonth(item.startsAt)}
                    </p>
                  </div>
                  <BookingStatusBadge
                    status={item.status as "cancelled_by_user" | "cancelled_by_admin"}
                    className="shrink-0"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
