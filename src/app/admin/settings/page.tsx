import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudioDateTime } from "@/lib/datetime";
import { getEnv } from "@/lib/env";
import { canManageSettings } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { listRecentNotificationDeliveries } from "@/modules/notifications/queries";
import {
  runDailyNotificationsNowAction,
  sendTestNotificationAction,
  updateOperationalSettingsAction,
} from "@/modules/settings/actions";
import { getOperationalSettings } from "@/modules/settings/queries";

type SettingsPageProps = {
  searchParams: Promise<{
    notificationAction?: string;
    notificationStatus?: string;
    notificationDetail?: string;
    attempted?: string;
    sent?: string;
    skipped?: string;
    failed?: string;
  }>;
};

function getDeliveryBadgeVariant(status: string) {
  switch (status) {
    case "sent":
      return "default";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function buildNotificationFeedback(params: Awaited<SettingsPageProps["searchParams"]>) {
  if (params.notificationAction === "test_email") {
    if (params.notificationStatus === "sent") {
      return "Correo de prueba enviado correctamente.";
    }

    if (params.notificationStatus === "skipped") {
      return `El correo de prueba no se envio: ${params.notificationDetail ?? "salio como skipped."}`;
    }

    if (params.notificationStatus === "failed") {
      return `El correo de prueba fallo: ${params.notificationDetail ?? "error desconocido."}`;
    }
  }

  if (params.notificationAction === "daily_run") {
    return `Ejecucion diaria completada. Intentados: ${params.attempted ?? "0"}, enviados: ${params.sent ?? "0"}, omitidos: ${params.skipped ?? "0"}, fallidos: ${params.failed ?? "0"}.`;
  }

  return null;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { profile } = await requireStaffContext();

  if (!canManageSettings(profile.role)) {
    redirect("/admin");
  }

  const params = await searchParams;
  const feedback = buildNotificationFeedback(params);
  const env = getEnv();
  const [settings, deliveries] = await Promise.all([
    getOperationalSettings(),
    listRecentNotificationDeliveries(12),
  ]);
  const transportMode = env.EMAIL_TRANSPORT_MODE ?? "log";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Configuracion
        </p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">
          Parametros operativos
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Ajusta reglas globales y valida emails o cron cuando haga falta.
        </p>
      </div>

      {feedback ? (
        <Card size="sm" className="rounded-[28px] border-border/70 shadow-sm">
          <CardContent className="pt-4 text-sm text-muted-foreground">{feedback}</CardContent>
        </Card>
      ) : null}

      <Card size="sm" className="rounded-[28px] border-border/70 shadow-sm">
        <CardHeader className="gap-0.5">
          <CardTitle>Reglas globales</CardTitle>
          <CardDescription className="text-xs">
            Alertas, dashboard y reservas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={updateOperationalSettingsAction}
            className="grid gap-4 lg:grid-cols-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="renewalWindowDays">Ventana de renovaciones</Label>
              <Input
                id="renewalWindowDays"
                name="renewalWindowDays"
                type="number"
                min={1}
                max={30}
                defaultValue={settings.renewalWindowDays}
              />
              <p className="text-xs text-muted-foreground">
                Dias a futuro para vencimientos y seguimiento.
              </p>
            </div>

            <div className="space-y-1.5">
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
                Saldo maximo para marcar cupo critico.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bookingBufferHours">Buffer entre reservas</Label>
              <Input
                id="bookingBufferHours"
                name="bookingBufferHours"
                type="number"
                min={0}
                max={12}
                defaultValue={settings.bookingBufferHours}
              />
              <p className="text-xs text-muted-foreground">
                Horas bloqueadas antes y despues de cada reserva.
              </p>
            </div>

            <div className="flex justify-end lg:col-span-3">
              <Button type="submit" size="sm">Guardar configuracion</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card size="sm" className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader className="gap-0.5">
            <CardTitle>Notificaciones y cron</CardTitle>
            <CardDescription>
              Estado de configuracion para envio real y herramientas manuales de validacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Transporte
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="font-semibold">{transportMode}</p>
                  <Badge variant={transportMode === "resend" ? "default" : "outline"}>
                    {transportMode === "resend" ? "Real" : "Log"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Remitente: {env.EMAIL_FROM ?? "sin configurar"}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Secretos
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Resend API key: {env.RESEND_API_KEY ? "configurada" : "faltante"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cron secret: {env.CRON_SECRET ? "configurado" : "faltante"}
                </p>
              </div>
            </div>

            <form action={sendTestNotificationAction} className="space-y-2.5 rounded-2xl border border-border/70 bg-background p-4">
              <div className="space-y-1.5">
                <Label htmlFor="recipientEmail">Correo de prueba</Label>
                <Input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  defaultValue={profile.email}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Envia un email de prueba al destinatario indicado y registra el resultado en auditoria.
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" size="sm">
                  Enviar prueba
                </Button>
              </div>
            </form>

            <form action={runDailyNotificationsNowAction} className="space-y-2.5 rounded-2xl border border-border/70 bg-background p-4">
              <p className="text-sm text-muted-foreground">
                Ejecuta ahora el mismo flujo que corre el cron diario. Si ya corrio hoy, la
                deduplicacion puede marcar entregas como omitidas.
              </p>
              <div className="flex justify-end">
                <Button type="submit" size="sm">Ejecutar cron ahora</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-[28px] border-border/70 shadow-sm">
          <CardHeader className="gap-0.5">
            <CardTitle>Estado actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              La politica de cancelacion sigue tomando el valor del plan activo del miembro.
            </p>
            <p>Las alertas de renovacion usan una ventana de {settings.renewalWindowDays} dias.</p>
            <p>Los cupos bajos se senalan con {settings.lowQuotaThreshold} cupos o menos.</p>
            <p>El buffer operativo entre reservas esta en {settings.bookingBufferHours} hora(s).</p>
            <p>APP_URL actual: {env.APP_URL ?? "sin configurar"}.</p>
          </CardContent>
        </Card>
      </div>

      <Card size="sm" className="rounded-[28px] border-border/70 shadow-sm">
        <CardHeader className="gap-0.5">
          <CardTitle>Ultimas entregas</CardTitle>
          <CardDescription>
            Historial reciente para validar textos, dedupe y fallas del proveedor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Ultimo detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Todavia no hay entregas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{delivery.eventType}</p>
                        <p className="text-xs text-muted-foreground">{delivery.subject}</p>
                      </div>
                    </TableCell>
                    <TableCell>{delivery.recipientEmail}</TableCell>
                    <TableCell>
                      <Badge variant={getDeliveryBadgeVariant(delivery.status)}>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatStudioDateTime(delivery.createdAt)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {delivery.errorMessage ??
                        delivery.providerMessageId ??
                        (delivery.sentAt ? `Enviado ${formatStudioDateTime(delivery.sentAt)}` : "-")}
                    </TableCell>
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
