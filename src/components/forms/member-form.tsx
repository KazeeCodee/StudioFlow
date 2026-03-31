import { createMemberAction } from "@/modules/members/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { listActivePlanOptions } from "@/modules/plans/queries";

type PlanOption = Awaited<ReturnType<typeof listActivePlanOptions>>[number];

type MemberFormProps = {
  planOptions: PlanOption[];
};

export function MemberForm({ planOptions }: MemberFormProps) {
  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader>
        <CardTitle>Crear miembro</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createMemberAction} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fullName">Nombre y apellido</Label>
            <Input id="fullName" name="fullName" placeholder="Ana Pérez" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="ana@correo.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" placeholder="+54 11 ..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña inicial</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              name="status"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              defaultValue="active"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="planId">Plan asignado</Label>
            <select
              id="planId"
              name="planId"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Seleccionar plan
              </option>
              {planOptions.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {plan.quotaAmount} cupos
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea id="notes" name="notes" placeholder="Observaciones del staff..." />
          </div>

          <div className="md:col-span-2">
            <Button type="submit">Crear miembro</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
