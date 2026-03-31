import Link from "next/link";
import { CalendarDays, CreditCard, MapPinned, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MemberPortalSnapshot } from "@/modules/member-portal/queries";

type MemberOverviewProps = {
  data: MemberPortalSnapshot;
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function MemberOverview({ data }: MemberOverviewProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Resumen personal</CardTitle>
            <CardDescription>
              Estado actual de tu membresía y de las próximas reservas de tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Plan activo
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {data.activePlan?.planName ?? "Sin plan activo"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.activePlan
                  ? `${data.activePlan.quotaUsed ?? 0} usados de ${data.activePlan.quotaTotal} cupos`
                  : "Contactá al staff para regularizar tu cuenta."}
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Cupos disponibles
              </p>
              <p className="mt-3 text-3xl font-semibold">
                {data.activePlan?.quotaRemaining ?? 0}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Equivalentes a horas base del estudio.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Próximo control
              </p>
              <p className="mt-3 text-3xl font-semibold">
                {data.activePlan
                  ? dateFormatter.format(data.activePlan.nextPaymentDueAt)
                  : "--"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Renovación manual visible para tu seguimiento.
              </p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Próxima reserva
              </p>
              <p className="mt-3 text-xl font-semibold">
                {data.nextBooking?.spaceName ?? "Sin reservas próximas"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.nextBooking
                  ? `${dateTimeFormatter.format(data.nextBooking.startsAt)}`
                  : "Aún no tenés reservas futuras."}
              </p>
            </article>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Tu próximo movimiento</CardTitle>
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
                    Mirá tus horarios futuros y cancelá con {data.activePlan?.cancellationPolicyHours ?? 24}h de anticipación.
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
                      ? `Tu plan vence el ${dateFormatter.format(data.activePlan.endsAt)}`
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
                  <p className="font-medium">Reservá según disponibilidad real</p>
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
