import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Configuración</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Parámetros operativos</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Esta vista queda preparada para la siguiente iteración de parámetros globales del estudio. Por ahora, las reglas de cancelación viven en cada plan y las alertas operan con ventanas seguras por defecto.
        </p>
      </div>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Estado actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>La política de cancelación se toma desde el plan activo del miembro.</p>
          <p>Las alertas de renovación muestran próximos vencimientos dentro de 7 días.</p>
          <p>Los cupos bajos se señalan cuando un miembro tiene 3 o menos cupos restantes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
