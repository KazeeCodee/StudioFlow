import Link from "next/link";
import { CalendarDays, CreditCard, MapPinned, Sparkles } from "lucide-react";
import { formatStudioDateTime, formatStudioDayMonth } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberPortalSnapshot } from "@/modules/member-portal/queries";

type MemberOverviewProps = {
  data: MemberPortalSnapshot;
};

export function MemberOverview({ data }: MemberOverviewProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Resumen personal</CardTitle>
            <CardDescription>
              Estado actual de tu membresia y de las proximas reservas de tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Plan activo</p>
              <p className="mt-3 text-2xl font-semibold">
                {data.activePlan?.planName ?? "Sin plan activo"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.activePlan
                  ? `${data.activePlan.quotaUsed ?? 0} usados de ${data.activePlan.quotaTotal} cupos`
                  : "Contacta al staff para regularizar tu cuenta."}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Cupos disponibles
              </p>
              <p className="mt-3 text-3xl font-semibold">{data.activePlan?.quotaRemaining ?? 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Equivalentes a horas base del estudio.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Proximo control</p>
              <p className="mt-3 text-3xl font-semibold">
                {data.activePlan ? formatStudioDayMonth(data.activePlan.nextPaymentDueAt) : "--"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Renovacion manual visible para tu seguimiento.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Proxima reserva</p>
              <p className="mt-3 text-xl font-semibold">
                {data.nextBooking?.spaceName ?? "Sin reservas proximas"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.nextBooking
                  ? formatStudioDateTime(data.nextBooking.startsAt)
                  : "Aun no tenes reservas futuras."}
              </p>
            </article>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Tu proximo movimiento</CardTitle>
            <CardDescription>
              Todo lo importante para reservar sin perder visibilidad sobre tu plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <article className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl border border-border/70 bg-background p-3">
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{data.upcomingBookingsCount} reservas por delante</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mira tus horarios futuros y cancela con {data.activePlan?.cancellationPolicyHours ?? 24}h de anticipacion.
                  </p>
                </div>
              </div>
            </article>
            <article className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl border border-border/70 bg-background p-3">
                  <CreditCard className="size-5" />
                </span>
                <div>
                  <p className="font-medium">
                    {data.activePlan
                      ? `Tu plan vence el ${formatStudioDayMonth(data.activePlan.endsAt)}`
                      : "Sin plan vigente"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Si ya abonaste, el staff va a renovar tu ciclo manualmente.
                  </p>
                </div>
              </div>
            </article>
            <article className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl border border-border/70 bg-background p-3">
                  <MapPinned className="size-5" />
                </span>
                <div>
                  <p className="font-medium">Reserva segun disponibilidad real</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    El sistema valida conflictos y cupos antes de confirmar.
                  </p>
                </div>
              </div>
            </article>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="rounded-2xl">
                <Link href="/member/bookings/new">
                  <Sparkles className="mr-2 size-4" />
                  Reservar ahora
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-2xl">
                <Link href="/member/plan">Ver mi plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
