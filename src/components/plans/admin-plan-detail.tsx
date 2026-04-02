import { formatStudioDateTime } from "@/lib/datetime";
import { updatePlanAction, updatePlanStatusAction } from "@/modules/plans/actions";
import type { getPlanDetail } from "@/modules/plans/queries";
import { PlanForm } from "@/components/forms/plan-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PlanDetail = Awaited<ReturnType<typeof getPlanDetail>>;

type AdminPlanDetailProps = {
  plan: PlanDetail;
};

export function AdminPlanDetail({ plan }: AdminPlanDetailProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Resumen del plan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estado</p>
              <p className="mt-2 text-xl font-semibold">{plan.status}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cupos</p>
              <p className="mt-2 text-xl font-semibold">{plan.quotaAmount}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vigencia</p>
              <p className="mt-2 text-xl font-semibold">
                {plan.durationValue} {plan.durationType}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cancelación</p>
              <p className="mt-2 text-xl font-semibold">{plan.cancellationPolicyHours}h</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Metadatos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Precio</p>
              <p className="font-medium">{plan.price ?? "Sin precio de referencia"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Creado</p>
              <p className="font-medium">{formatStudioDateTime(plan.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Actualizado</p>
              <p className="font-medium">{formatStudioDateTime(plan.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <PlanForm
          action={updatePlanAction}
          title="Editar reglas del plan"
          submitLabel="Guardar reglas"
          defaultValues={{
            name: plan.name,
            description: plan.description,
            status: plan.status,
            durationType: plan.durationType,
            durationValue: plan.durationValue,
            quotaAmount: plan.quotaAmount,
            price: plan.price,
            cancellationPolicyHours: plan.cancellationPolicyHours,
            maxBookingsPerDay: plan.maxBookingsPerDay,
            maxBookingsPerWeek: plan.maxBookingsPerWeek,
          }}
          showStatusField={false}
        >
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="status" value={plan.status} />
        </PlanForm>

        <Card className="rounded-[28px] border-border/70">
          <CardHeader>
            <CardTitle>Estado del plan</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updatePlanStatusAction} className="grid gap-5">
              <input type="hidden" name="planId" value={plan.id} />

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  defaultValue={plan.status}
                >
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="archived">Archivado</option>
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
      </div>
    </div>
  );
}
