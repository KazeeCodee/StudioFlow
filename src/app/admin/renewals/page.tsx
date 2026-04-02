import { redirect } from "next/navigation";
import { formatStudioDate } from "@/lib/datetime";
import { renewMemberPlanAction } from "@/modules/renewals/actions";
import { listRenewalAlerts, listRecentRenewals } from "@/modules/alerts/queries";
import { listRenewalCandidates } from "@/modules/renewals/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canRenewPlans } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";

export default async function RenewalsPage() {
  const { profile } = await requireStaffContext();

  if (!canRenewPlans(profile.role)) {
    redirect("/admin");
  }

  const [candidates, alerts, recentRenewals] = await Promise.all([
    listRenewalCandidates(),
    listRenewalAlerts(),
    listRecentRenewals(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Renovaciones</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Seguimiento manual de pagos</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Desde aca el staff detecta vencimientos, ve cupos bajos y registra manualmente que un miembro abono su proximo ciclo.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Proximas renovaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Vence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.upcomingRenewals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No hay vencimientos proximos en la ventana configurada.
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.upcomingRenewals.map((item) => (
                    <TableRow key={item.memberPlanId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.memberName}</p>
                          <p className="text-xs text-muted-foreground">{item.memberEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.planName}</TableCell>
                      <TableCell>{formatStudioDate(item.nextPaymentDueAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Cupos bajos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Cupos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.lowQuotaPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No hay miembros con cupos criticos en este momento.
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.lowQuotaPlans.map((item) => (
                    <TableRow key={item.memberPlanId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.memberName}</p>
                          <p className="text-xs text-muted-foreground">{item.memberEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.planName}</TableCell>
                      <TableCell>{item.quotaRemaining}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Registrar pago y renovar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Cupos</TableHead>
                <TableHead>Registrar pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No hay planes activos para renovar.
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((item) => (
                  <TableRow key={item.memberPlanId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.memberName}</p>
                        <p className="text-xs text-muted-foreground">{item.memberEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.planName}</TableCell>
                    <TableCell>{formatStudioDate(item.nextPaymentDueAt)}</TableCell>
                    <TableCell>
                      {item.quotaRemaining} / {item.quotaTotal}
                    </TableCell>
                    <TableCell>
                      <form action={renewMemberPlanAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <input type="hidden" name="memberPlanId" value={item.memberPlanId} />
                        <input type="hidden" name="redirectTo" value="/admin/renewals" />
                        <div className="space-y-2">
                          <Label htmlFor={`notes-${item.memberPlanId}`}>Nota</Label>
                          <Input id={`notes-${item.memberPlanId}`} name="notes" placeholder="Pago recibido por transferencia" />
                        </div>
                        <div className="md:self-end">
                          <Button type="submit">Renovar</Button>
                        </div>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Ultima renovacion</TableHead>
                <TableHead>Proximo control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRenewals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Aun no hay renovaciones registradas.
                  </TableCell>
                </TableRow>
              ) : (
                recentRenewals.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.memberName}</TableCell>
                    <TableCell>{item.planName}</TableCell>
                    <TableCell>{item.lastRenewedAt ? formatStudioDate(item.lastRenewedAt) : "Sin renovaciones"}</TableCell>
                    <TableCell>{formatStudioDate(item.nextPaymentDueAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
