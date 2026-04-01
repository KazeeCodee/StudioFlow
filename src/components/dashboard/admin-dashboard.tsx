import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  CreditCard,
  Users,
  WalletCards,
} from "lucide-react";
import { formatStudioDayMonth, formatStudioTime } from "@/lib/datetime";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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

const metricCards = [
  {
    key: "bookingsToday",
    label: "Reservas hoy",
    icon: CalendarClock,
    tone:
      "border-cyan-200/80 bg-cyan-50/70 text-cyan-950 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-100",
    suffix: "",
  },
  {
    key: "bookedHoursThisWeek",
    label: "Horas esta semana",
    icon: Clock3,
    tone:
      "border-emerald-200/80 bg-emerald-50/70 text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100",
    suffix: " h",
  },
  {
    key: "activeMembers",
    label: "Miembros activos",
    icon: Users,
    tone:
      "border-amber-200/80 bg-amber-50/70 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100",
    suffix: "",
  },
  {
    key: "upcomingRenewals",
    label: "Renovaciones proximas",
    icon: CreditCard,
    tone:
      "border-rose-200/80 bg-rose-50/70 text-rose-950 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100",
    suffix: "",
  },
  {
    key: "lowQuotaPlans",
    label: "Cupos criticos",
    icon: WalletCards,
    tone:
      "border-violet-200/80 bg-violet-50/70 text-violet-950 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100",
    suffix: "",
  },
] as const;

function getStatusBadgeLabel(status: AdminDashboardData["todayAgenda"][number]["status"]) {
  switch (status) {
    case "confirmed":
      return "Confirmada";
    case "completed":
      return "Completada";
    case "no_show":
      return "No asistio";
    default:
      return "Pendiente";
  }
}

function getCancellationBadgeLabel(
  status: AdminDashboardData["recentCancellations"][number]["status"],
) {
  return status === "cancelled_by_admin" ? "Cancelada por staff" : "Cancelada por miembro";
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Pulso operativo del estudio"
        subtitle="Una lectura rapida del dia para saber como viene la agenda, que membresias requieren seguimiento y donde se esta concentrando el uso del estudio."
        statusLabel={`${data.metrics.upcomingRenewals} seguimientos esta semana`}
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const value = data.metrics[card.key];

          return (
            <Card key={card.key} className="rounded-[28px] border-border/70 shadow-sm">
              <CardContent className="flex items-start justify-between gap-4 pt-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-3xl font-semibold tracking-tight">
                    {value}
                    {card.suffix}
                  </p>
                </div>
                <div className={`rounded-2xl border p-3 ${card.tone}`} aria-hidden="true">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Agenda de hoy</CardTitle>
            <CardDescription>
              Reservas activas del dia con su franja, espacio y consumo de cupos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horario</TableHead>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Espacio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Cupos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.todayAgenda.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No hay reservas activas para hoy.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.todayAgenda.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {formatStudioTime(item.startsAt)} - {formatStudioTime(item.endsAt)}
                      </TableCell>
                      <TableCell className="font-medium">{item.memberName}</TableCell>
                      <TableCell>{item.spaceName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getStatusBadgeLabel(item.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.quotaConsumed}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Accesos rapidos</CardTitle>
            <CardDescription>
              Entradas directas a las pantallas que mas se usan durante la operacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild className="justify-between rounded-2xl px-4 py-5">
              <Link href="/admin/bookings/new">
                Crear reserva manual
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between rounded-2xl px-4 py-5">
              <Link href="/admin/calendar">
                Abrir calendario general
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between rounded-2xl px-4 py-5">
              <Link href="/admin/renewals">
                Revisar renovaciones
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between rounded-2xl px-4 py-5">
              <Link href="/admin/spaces">
                Gestionar espacios
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Uso por espacio</CardTitle>
            <CardDescription>Distribucion de horas reservadas de la semana actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.spaceUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aun no hay horas reservadas en esta semana.
              </p>
            ) : (
              data.spaceUsage.map((item) => (
                <article
                  key={item.spaceId}
                  className="rounded-2xl border border-border/70 bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.spaceName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.sharePercentage}% del total semanal
                      </p>
                    </div>
                    <Badge variant="outline">{item.bookedHours} h</Badge>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(item.sharePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {item.quotaConsumed} cupos consumidos
                  </p>
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Cancelaciones recientes</CardTitle>
            <CardDescription>
              Ultimos movimientos cancelados para detectar huecos operativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentCancellations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No se registraron cancelaciones recientes.</p>
            ) : (
              data.recentCancellations.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border/70 bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.memberName}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.spaceName} · {formatStudioDayMonth(item.startsAt)}
                      </p>
                    </div>
                    <Badge variant="outline">{getCancellationBadgeLabel(item.status)}</Badge>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
