import { createPlanAction } from "@/modules/plans/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PlanFormValues = {
  name?: string;
  description?: string | null;
  status?: "draft" | "active" | "inactive" | "archived";
  durationType?: "weekly" | "monthly" | "custom";
  durationValue?: number;
  quotaAmount?: number;
  price?: string | null;
  cancellationPolicyHours?: number;
  maxBookingsPerDay?: number | null;
  maxBookingsPerWeek?: number | null;
};

type PlanFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  title?: string;
  submitLabel?: string;
  defaultValues?: PlanFormValues;
  showStatusField?: boolean;
  children?: React.ReactNode;
};

export function PlanForm({
  action = createPlanAction,
  title = "Crear plan",
  submitLabel = "Guardar plan",
  defaultValues,
  showStatusField = true,
  children,
}: PlanFormProps) {
  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5 md:grid-cols-2">
          {children}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              placeholder="Plan Producción"
              defaultValue={defaultValues?.name ?? ""}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Incluye horas mensuales y prioridad de agenda."
              defaultValue={defaultValues?.description ?? ""}
            />
          </div>

          {showStatusField ? (
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                defaultValue={defaultValues?.status ?? "draft"}
              >
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="durationType">Tipo de vigencia</Label>
            <select
              id="durationType"
              name="durationType"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              defaultValue={defaultValues?.durationType ?? "monthly"}
            >
              <option value="monthly">Mensual</option>
              <option value="weekly">Semanal</option>
              <option value="custom">Personalizada (días)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationValue">Duración</Label>
            <Input
              id="durationValue"
              name="durationValue"
              type="number"
              min={1}
              defaultValue={defaultValues?.durationValue ?? 1}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quotaAmount">Cupos</Label>
            <Input
              id="quotaAmount"
              name="quotaAmount"
              type="number"
              min={1}
              defaultValue={defaultValues?.quotaAmount ?? 12}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio de referencia</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              defaultValue={defaultValues?.price ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellationPolicyHours">Cancelación hasta</Label>
            <Input
              id="cancellationPolicyHours"
              name="cancellationPolicyHours"
              type="number"
              min={0}
              defaultValue={defaultValues?.cancellationPolicyHours ?? 24}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxBookingsPerDay">Límite por día</Label>
            <Input
              id="maxBookingsPerDay"
              name="maxBookingsPerDay"
              type="number"
              min={1}
              placeholder="Opcional"
              defaultValue={defaultValues?.maxBookingsPerDay ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxBookingsPerWeek">Límite por semana</Label>
            <Input
              id="maxBookingsPerWeek"
              name="maxBookingsPerWeek"
              type="number"
              min={1}
              placeholder="Opcional"
              defaultValue={defaultValues?.maxBookingsPerWeek ?? ""}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit">{submitLabel}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
