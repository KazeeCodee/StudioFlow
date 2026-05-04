import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  MapPinned,
  Sparkles,
  Compass,
  WalletCards,
  CalendarClock,
} from "lucide-react";
import { formatStudioDateTime, formatStudioDayMonth } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { QuotaBar } from "@/components/ui/quota-bar";
import type { MemberPortalSnapshot } from "@/modules/member-portal/queries";

type MemberOverviewProps = {
  data: MemberPortalSnapshot;
};

export function MemberOverview({ data }: MemberOverviewProps) {
  const plan = data.activePlan;
  const quotaUsed = plan?.quotaUsed ?? 0;
  const quotaTotal = plan?.quotaTotal ?? 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Left column: hero + secondary metrics ──────────────────────── */}
        <div className="space-y-4">
          <StatCard
            label="Cupos disponibles"
            value={plan?.quotaRemaining ?? 0}
            icon={Sparkles}
            tone="violet"
            size="hero"
            description={
              plan
                ? "Equivalentes a horas base del estudio"
                : "Sin plan activo. Contacta al staff."
            }
            breakdown={
              plan ? (
                <QuotaBar used={quotaUsed} total={quotaTotal} />
              ) : undefined
            }
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Plan activo"
              value={plan?.planName ?? "Sin plan"}
              icon={CreditCard}
              tone="violet"
            />
            <StatCard
              label="Proximo control"
              value={plan ? formatStudioDayMonth(plan.nextPaymentDueAt) : "--"}
              icon={CalendarClock}
              tone="amber"
              description={plan ? "Renovacion manual" : undefined}
            />
            <StatCard
              label="Proxima reserva"
              value={data.nextBooking?.spaceName ?? "Sin reservas"}
              icon={MapPinned}
              tone="cyan"
              description={
                data.nextBooking
                  ? formatStudioDateTime(data.nextBooking.startsAt)
                  : "Aun no tenes reservas futuras"
              }
            />
          </div>
        </div>

        {/* ── Right column: next moves card ──────────────────────────────── */}
        <Card className="rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20"
                aria-hidden="true"
              >
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-base font-semibold">
                  Tu proximo movimiento
                </CardTitle>
                <CardDescription className="mt-0.5 text-sm">
                  Todo lo importante para reservar sin perder visibilidad sobre tu plan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <article className="group flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400"
                aria-hidden="true"
              >
                <CalendarDays className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {data.upcomingBookingsCount} reservas por delante
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Mira tus horarios futuros y cancela con {plan?.cancellationPolicyHours ?? 24}h de anticipacion.
                </p>
              </div>
            </article>

            <article className="group flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                aria-hidden="true"
              >
                <CreditCard className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {plan
                    ? `Tu plan vence el ${formatStudioDayMonth(plan.endsAt)}`
                    : "Sin plan vigente"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Si ya abonaste, el staff va a renovar tu ciclo manualmente.
                </p>
              </div>
            </article>

            <article className="group flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-3.5 transition-colors hover:bg-muted/40">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                aria-hidden="true"
              >
                <WalletCards className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  Reserva segun disponibilidad real
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  El sistema valida conflictos y cupos antes de confirmar.
                </p>
              </div>
            </article>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button asChild className="rounded-xl">
                <Link href="/member/bookings/new">
                  <Sparkles className="mr-2 size-4" />
                  Reservar ahora
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/member/plan">Ver mi plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
