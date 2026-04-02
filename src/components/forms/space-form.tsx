import { createSpaceAction } from "@/modules/spaces/actions";
import { weekdayOptions } from "@/modules/spaces/schema";
import { SpaceMediaManager } from "@/components/spaces/space-media-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AvailabilityRuleValue = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

type SpaceFormValues = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  galleryUrls?: string[];
  videoLinks?: string[];
  capacity?: number | null;
  status?: "active" | "inactive" | "maintenance";
  hourlyQuotaCost?: number;
  minBookingHours?: number;
  maxBookingHours?: number;
  availabilityRules?: AvailabilityRuleValue[];
};

type SpaceFormProps = {
  action?: (formData: FormData) => void | Promise<void>;
  title?: string;
  submitLabel?: string;
  defaultValues?: SpaceFormValues;
  children?: React.ReactNode;
};

function getAvailabilityRule(defaultValues: SpaceFormValues | undefined, dayOfWeek: number) {
  return (
    defaultValues?.availabilityRules?.find((rule) => rule.dayOfWeek === dayOfWeek) ?? {
      dayOfWeek,
      isActive: dayOfWeek >= 1 && dayOfWeek <= 6,
      startTime: "09:00",
      endTime: "18:00",
    }
  );
}

export function SpaceForm({
  action = createSpaceAction,
  title = "Crear espacio",
  submitLabel = "Guardar espacio",
  defaultValues,
  children,
}: SpaceFormProps) {
  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form action={action} className="space-y-10">
          {children}

          {/* ── Información básica ─────────────────────────────────────────── */}
          <section className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Información básica</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nombre, descripción y datos operativos del espacio.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Sala podcast"
                  defaultValue={defaultValues?.name ?? ""}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Detalles operativos y equipamiento disponible."
                  defaultValue={defaultValues?.description ?? ""}
                  className="min-h-[80px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad (personas)</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  placeholder="Opcional"
                  defaultValue={defaultValues?.capacity ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50"
                  defaultValue={defaultValues?.status ?? "active"}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="maintenance">Mantenimiento</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyQuotaCost">Costo por hora (cupos)</Label>
                <Input
                  id="hourlyQuotaCost"
                  name="hourlyQuotaCost"
                  type="number"
                  min={1}
                  defaultValue={defaultValues?.hourlyQuotaCost ?? 1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minBookingHours">Reserva mínima (horas)</Label>
                <Input
                  id="minBookingHours"
                  name="minBookingHours"
                  type="number"
                  min={1}
                  defaultValue={defaultValues?.minBookingHours ?? 1}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="maxBookingHours">Reserva máxima (horas)</Label>
                <Input
                  id="maxBookingHours"
                  name="maxBookingHours"
                  type="number"
                  min={1}
                  defaultValue={defaultValues?.maxBookingHours ?? 4}
                  required
                />
              </div>
            </div>
          </section>

          {/* ── Media: imágenes y videos ───────────────────────────────────── */}
          <section className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Imágenes y videos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Subí fotos del espacio y añadí links de YouTube para mostrar recorridos o demos
                sin cargar videos al servidor.
              </p>
            </div>

            <input type="hidden" name="currentImageUrl" value={defaultValues?.imageUrl ?? ""} />

            <SpaceMediaManager
              mainImageUrl={defaultValues?.imageUrl}
              initialGalleryUrls={defaultValues?.galleryUrls ?? []}
              initialVideoLinks={defaultValues?.videoLinks ?? []}
              spaceName={defaultValues?.name}
            />
          </section>

          {/* ── Disponibilidad semanal ─────────────────────────────────────── */}
          <section className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Disponibilidad semanal</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Definí los rangos base habilitados para reservas. Después podés agregar bloqueos
                puntuales.
              </p>
            </div>

            <div className="grid gap-3">
              {weekdayOptions.map((day) => {
                const availabilityRule = getAvailabilityRule(defaultValues, day.value);
                return (
                  <div
                    key={day.value}
                    className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 md:grid-cols-[160px_100px_1fr_1fr]"
                  >
                    <label className="flex items-center gap-3 text-sm font-medium">
                      <input
                        className="h-4 w-4 rounded border-border accent-primary"
                        type="checkbox"
                        name={`availability-${day.value}-enabled`}
                        defaultChecked={availabilityRule.isActive}
                      />
                      {day.label}
                    </label>

                    <div className="text-xs text-muted-foreground md:self-center">
                      Día {day.value}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`availability-${day.value}-start`} className="text-xs">
                        Desde
                      </Label>
                      <Input
                        id={`availability-${day.value}-start`}
                        name={`availability-${day.value}-start`}
                        type="time"
                        defaultValue={availabilityRule.startTime.slice(0, 5)}
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`availability-${day.value}-end`} className="text-xs">
                        Hasta
                      </Label>
                      <Input
                        id={`availability-${day.value}-end`}
                        name={`availability-${day.value}-end`}
                        type="time"
                        defaultValue={availabilityRule.endTime.slice(0, 5)}
                        className="h-9"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <Button type="submit" className="w-full sm:w-auto">
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
