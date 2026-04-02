import { formatStudioDate, formatStudioDateTime } from "@/lib/datetime";
import {
  adjustMemberQuotaAction,
  changeMemberPlanAction,
  updateMemberProfileAction,
  updateMemberStatusAction,
} from "@/modules/members/actions";
import type { getMemberDetail } from "@/modules/members/queries";
import type { listActivePlanOptions } from "@/modules/plans/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type MemberDetail = Awaited<ReturnType<typeof getMemberDetail>>;
type PlanOption = Awaited<ReturnType<typeof listActivePlanOptions>>[number];

type AdminMemberDetailProps = {
  member: MemberDetail;
  planOptions: PlanOption[];
};

export function AdminMemberDetail({
  member,
  planOptions,
}: AdminMemberDetailProps) {
  const availablePlanOptions = planOptions.filter((plan) => plan.id !== member.activePlan?.planId);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Resumen operativo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estado</p>
              <p className="mt-2 text-xl font-semibold">{member.status}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Plan activo</p>
              <p className="mt-2 text-xl font-semibold">
                {member.activePlan?.planName ?? "Sin plan activo"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cupos restantes</p>
              <p className="mt-2 text-xl font-semibold">{member.activePlan?.quotaRemaining ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Proximo vencimiento</p>
              <p className="mt-2 text-xl font-semibold">
                {member.activePlan ? formatStudioDate(member.activePlan.endsAt) : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Ficha base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{member.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefono</p>
              <p className="font-medium">{member.phone ?? "Sin telefono"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Notas</p>
              <p className="font-medium">{member.notes ?? "Sin notas internas"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Alta</p>
              <p className="font-medium">{formatStudioDateTime(member.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Editar ficha</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateMemberProfileAction} className="grid gap-5">
              <input type="hidden" name="memberId" value={member.id} />

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre y apellido</Label>
                <Input id="fullName" name="fullName" defaultValue={member.fullName} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" name="phone" defaultValue={member.phone ?? ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea id="notes" name="notes" defaultValue={member.notes ?? ""} />
              </div>

              <Button type="submit">Guardar cambios</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Cambiar estado</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateMemberStatusAction} className="grid gap-5">
              <input type="hidden" name="memberId" value={member.id} />

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  defaultValue={member.status}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Nota operativa</Label>
                <Textarea id="reason" name="reason" placeholder="Motivo del cambio de estado..." />
              </div>

              <Button type="submit" variant="outline">Actualizar estado</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Ajuste manual de cupos</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={adjustMemberQuotaAction} className="grid gap-5">
              <input type="hidden" name="memberId" value={member.id} />

              <div className="space-y-2">
                <Label htmlFor="delta">Delta de cupos</Label>
                <Input id="delta" name="delta" type="number" placeholder="-2 o 3" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quota-reason">Motivo</Label>
                <Textarea
                  id="quota-reason"
                  name="reason"
                  placeholder="Ejemplo: correccion por carga manual"
                  required
                />
              </div>

              <Button type="submit" variant="outline" disabled={!member.activePlan}>
                Aplicar ajuste
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Cambiar plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={changeMemberPlanAction} className="grid gap-5">
              <input type="hidden" name="memberId" value={member.id} />

              <div className="space-y-2">
                <Label htmlFor="planId">Nuevo plan</Label>
                <select
                  id="planId"
                  name="planId"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Seleccionar plan
                  </option>
                  {availablePlanOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} · {plan.quotaAmount} cupos
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-reason">Nota operativa</Label>
                <Textarea id="plan-reason" name="reason" placeholder="Contexto del cambio de plan..." />
              </div>

              <Button type="submit">Asignar plan</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Historial reciente de planes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>Cupos restantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {member.planHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Todavia no hay historial de planes para este miembro.
                  </TableCell>
                </TableRow>
              ) : (
                member.planHistory.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.planName}</TableCell>
                    <TableCell>{plan.status}</TableCell>
                    <TableCell>{formatStudioDate(plan.startsAt)}</TableCell>
                    <TableCell>{formatStudioDate(plan.endsAt)}</TableCell>
                    <TableCell>{plan.quotaRemaining}</TableCell>
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
