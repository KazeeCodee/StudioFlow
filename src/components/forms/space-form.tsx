import { createSpaceAction } from "@/modules/spaces/actions";
import { weekdayOptions } from "@/modules/spaces/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SpaceForm() {
  return (
    <Card className="rounded-[28px] border-border/70">
      <CardHeader>
        <CardTitle>Crear espacio</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createSpaceAction} className="space-y-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Sala podcast" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detalles operativos y equipamiento disponible."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Imagen principal</Label>
              <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad</Label>
              <Input id="capacity" name="capacity" type="number" min={1} placeholder="Opcional" />
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
                <option value="maintenance">Mantenimiento</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyQuotaCost">Costo por hora (cupos)</Label>
              <Input id="hourlyQuotaCost" name="hourlyQuotaCost" type="number" min={1} defaultValue={1} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minBookingHours">Reserva mínima</Label>
              <Input id="minBookingHours" name="minBookingHours" type="number" min={1} defaultValue={1} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxBookingHours">Reserva máxima</Label>
              <Input id="maxBookingHours" name="maxBookingHours" type="number" min={1} defaultValue={4} required />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Disponibilidad semanal</p>
              <p className="text-sm text-muted-foreground">
                Definí los rangos base habilitados para reservas. Después vas a poder agregar bloqueos puntuales.
              </p>
            </div>

            <div className="grid gap-3">
              {weekdayOptions.map((day) => (
                <div
                  key={day.value}
                  className="grid gap-3 rounded-2xl border border-border/70 bg-background p-4 md:grid-cols-[160px_120px_1fr_1fr]"
                >
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <input
                      className="h-4 w-4 rounded border-border"
                      type="checkbox"
                      name={`availability-${day.value}-enabled`}
                      defaultChecked={day.value >= 1 && day.value <= 6}
                    />
                    {day.label}
                  </label>

                  <div className="text-xs text-muted-foreground md:self-center">
                    Día {day.value}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`availability-${day.value}-start`}>Desde</Label>
                    <Input
                      id={`availability-${day.value}-start`}
                      name={`availability-${day.value}-start`}
                      type="time"
                      defaultValue="09:00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`availability-${day.value}-end`}>Hasta</Label>
                    <Input
                      id={`availability-${day.value}-end`}
                      name={`availability-${day.value}-end`}
                      type="time"
                      defaultValue="18:00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit">Guardar espacio</Button>
        </form>
      </CardContent>
    </Card>
  );
}
