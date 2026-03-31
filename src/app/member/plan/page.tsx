import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireMemberContext } from "@/modules/auth/queries";
import { getMemberPortalSnapshot, listMemberPlanBookings } from "@/modules/member-portal/queries";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});

export default async function MemberPlanPage() {
  const { profile } = await requireMemberContext();
  const [snapshot, bookings] = await Promise.all([
    getMemberPortalSnapshot(profile.id),
    listMemberPlanBookings(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Mi plan</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Estado de tu membresía</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Acá podés ver tu vigencia, los cupos disponibles y el historial reciente de consumo.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Resumen del plan</CardTitle>
            <CardDescription>Lectura rápida de tu ciclo actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Plan</p>
              <p className="mt-2 text-2xl font-semibold">
                {snapshot?.activePlan?.planName ?? "Sin plan activo"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Cupos
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {snapshot?.activePlan?.quotaRemaining ?? 0}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  de {snapshot?.activePlan?.quotaTotal ?? 0} disponibles
                </p>
              </article>
              <article className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Próximo pago
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {snapshot?.activePlan
                    ? dateFormatter.format(snapshot.activePlan.nextPaymentDueAt)
                    : "--"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  renovación manual por staff
                </p>
              </article>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Política de cancelación
              </p>
              <p className="mt-2 text-base font-medium">
                {snapshot?.activePlan?.cancellationPolicyHours ?? 24}h antes del inicio
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Consumo reciente</CardTitle>
            <CardDescription>
              Últimas reservas asociadas a tu plan para que puedas seguir el uso de cupos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Espacio</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Cupos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Todavía no tenés reservas asociadas a este plan.
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.spaceName}</TableCell>
                      <TableCell>{booking.startsAt.toLocaleString("es-AR")}</TableCell>
                      <TableCell>{booking.durationHours} h</TableCell>
                      <TableCell>{booking.quotaConsumed}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{booking.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
