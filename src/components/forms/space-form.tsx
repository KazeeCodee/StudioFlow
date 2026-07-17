"use client";

import { useActionState } from "react";
import { createSpaceAction } from "@/modules/spaces/actions";
import { SpaceMediaManager } from "@/components/spaces/space-media-manager";
import { WeeklyAvailabilityEditor } from "@/components/forms/weekly-availability-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type FormActionState,
  initialFormActionState,
} from "@/lib/form-action-state";

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

export function SpaceForm({
  action,
  title = "Crear espacio",
  submitLabel = "Guardar espacio",
  defaultValues,
  children,
}: SpaceFormProps) {
  const statefulAction = action
    ? async (
        _previousState: FormActionState,
        formData: FormData,
      ): Promise<FormActionState> => {
        await action(formData);
        return initialFormActionState;
      }
    : createSpaceAction;
  const [state, formAction, pending] = useActionState(
    statefulAction,
    initialFormActionState,
  );

  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-10">
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
                Definí uno o varios rangos por día para representar horarios partidos y pausas.
                Después podés agregar bloqueos puntuales.
              </p>
            </div>

            <WeeklyAvailabilityEditor initialRules={defaultValues?.availabilityRules} />
          </section>

          {state.status === "error" ? (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {state.message}
            </div>
          ) : null}

          <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
            {pending ? "Guardando..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
