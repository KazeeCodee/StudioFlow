import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canManageSettings } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { updateOperationalSettingsAction } from "@/modules/settings/actions";
import { getOperationalSettings } from "@/modules/settings/queries";

export default async function SettingsPage() {
  const { profile } = await requireStaffContext();

  if (!canManageSettings(profile.role)) {
    redirect("/admin");
  }

  const settings = await getOperationalSettings();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Configuración
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Parámetros operativos
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ajustá la ventana de seguimiento de renovaciones, el umbral de cupos
          bajos y el buffer obligatorio entre reservas.
        </p>
      </div>

      <Card className="rounded-[28px] border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Reglas globales</CardTitle>
          <CardDescription>
            Estos cambios impactan el dashboard, las alertas de renovaciones y
            la validación del motor de reservas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={updateOperationalSettingsAction}
            className="grid gap-5 lg:grid-cols-3"
          >
            <div className="space-y-2">
              <Label htmlFor="renewalWindowDays">
                Ventana de renovaciones
              </Label>
              <Input
                id="renewalWindowDays"
                name="renewalWindowDays"
                type="number"
                min={1}
                max={30}
                defaultValue={settings.renewalWindowDays}
              />
              <p className="text-xs text-muted-foreground">
                Cantidad de días a futuro para mostrar vencimientos y
                seguimientos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowQuotaThreshold">Umbral de cupos bajos</Label>
              <Input
                id="lowQuotaThreshold"
                name="lowQuotaThreshold"
                type="number"
                min={0}
                max={100}
                defaultValue={settings.lowQuotaThreshold}
              />
              <p className="text-xs text-muted-foreground">
                Cuando un miembro tenga este saldo o menos, aparecerá como cupo
                crítico.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookingBufferHours">
                Buffer entre reservas
              </Label>
              <Input
                id="bookingBufferHours"
                name="bookingBufferHours"
                type="number"
                min={0}
                max={12}
                defaultValue={settings.bookingBufferHours}
              />
              <p className="text-xs text-muted-foreground">
                Horas bloqueadas antes y después de cada reserva nueva.
              </p>
            </div>

            <div className="flex justify-end lg:col-span-3">
              <Button type="submit">Guardar configuración</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Estado actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            La política de cancelación sigue tomando el valor del plan activo
            del miembro.
          </p>
          <p>
            Las alertas de renovación usan una ventana de{" "}
            {settings.renewalWindowDays} días.
          </p>
          <p>
            Los cupos bajos se señalan con {settings.lowQuotaThreshold} cupos o
            menos.
          </p>
          <p>
            El buffer operativo entre reservas está en{" "}
            {settings.bookingBufferHours} hora(s).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
