import { createPlanAction } from "@/modules/plans/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PlanForm() {
  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader>
        <CardTitle>Crear plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createPlanAction} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Plan Producción" required />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Incluye horas mensuales y prioridad de agenda."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              name="status"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              defaultValue="draft"
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="archived">Archivado</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationType">Tipo de vigencia</Label>
            <select
              id="durationType"
              name="durationType"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              defaultValue="monthly"
            >
              <option value="monthly">Mensual</option>
              <option value="weekly">Semanal</option>
              <option value="custom">Personalizada (días)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationValue">Duración</Label>
            <Input id="durationValue" name="durationValue" type="number" min={1} defaultValue={1} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quotaAmount">Cupos</Label>
            <Input id="quotaAmount" name="quotaAmount" type="number" min={1} defaultValue={12} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio de referencia</Label>
            <Input id="price" name="price" type="number" min={0} step="0.01" placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellationPolicyHours">Cancelación hasta</Label>
            <Input
              id="cancellationPolicyHours"
              name="cancellationPolicyHours"
              type="number"
              min={0}
              defaultValue={24}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxBookingsPerDay">Límite por día</Label>
            <Input id="maxBookingsPerDay" name="maxBookingsPerDay" type="number" min={1} placeholder="Opcional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxBookingsPerWeek">Límite por semana</Label>
            <Input id="maxBookingsPerWeek" name="maxBookingsPerWeek" type="number" min={1} placeholder="Opcional" />
          </div>

          <div className="md:col-span-2">
            <Button type="submit">Guardar plan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
