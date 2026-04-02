"use client";

import { useState } from "react";
import { addDays, format, getDay, parse, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CalendarIcon, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createMemberBookingAction } from "@/modules/bookings/actions";

type AvailabilityRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type SmartSpaceOption = {
  id: string;
  name: string;
  hourlyQuotaCost: number;
  minBookingHours: number;
  maxBookingHours: number;
  imageUrl: string | null;
  availabilityRules: AvailabilityRule[];
};

type SmartBookingFormProps = {
  spaceOptions: SmartSpaceOption[];
  preselectedSpaceId?: string;
};

function parseSelectedDate(dateStr: string) {
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

export function SmartBookingForm({ spaceOptions, preselectedSpaceId }: SmartBookingFormProps) {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(preselectedSpaceId || "");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(0);

  const selectedSpace = spaceOptions.find((space) => space.id === selectedSpaceId);

  function isDateAvailable(dateStr: string, rules: AvailabilityRule[]) {
    if (!dateStr) {
      return false;
    }

    const dayOfWeek = getDay(parseSelectedDate(dateStr));
    return rules.some((rule) => rule.isActive && rule.dayOfWeek === dayOfWeek);
  }

  const today = startOfToday();
  const dateOptions = Array.from({ length: 30 }).map((_, index) => addDays(today, index));

  const startTimeOptions: string[] = [];
  if (selectedSpace && selectedDate) {
    const dayOfWeek = getDay(parseSelectedDate(selectedDate));
    const rule = selectedSpace.availabilityRules.find(
      (availabilityRule) => availabilityRule.dayOfWeek === dayOfWeek && availabilityRule.isActive,
    );

    if (rule) {
      const startHour = parseInt(rule.startTime.split(":")[0] ?? "0", 10);
      const endHour = parseInt(rule.endTime.split(":")[0] ?? "0", 10);

      for (let hour = startHour; hour < endHour; hour += 1) {
        startTimeOptions.push(`${hour.toString().padStart(2, "0")}:00`);
      }
    }
  }

  const quotaCost = selectedSpace && durationHours ? selectedSpace.hourlyQuotaCost * durationHours : 0;

  let startsAtStr = "";
  let endsAtStr = "";

  if (selectedDate && selectedStartTime && durationHours) {
    const startObj = parse(`${selectedDate} ${selectedStartTime}`, "yyyy-MM-dd HH:mm", new Date());
    const endObj = new Date(startObj.getTime() + durationHours * 60 * 60 * 1000);

    startsAtStr = format(startObj, "yyyy-MM-dd'T'HH:mm");
    endsAtStr = format(endObj, "yyyy-MM-dd'T'HH:mm");
  }

  return (
    <Card className="rounded-3xl overflow-hidden border-border/70 shadow-sm">
      <div className="grid md:grid-cols-[1fr_320px]">
        <div className="space-y-8 p-6 md:p-8">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Detalles de tu reserva</h3>
            <p className="mt-1 text-sm text-muted-foreground">Elegi el espacio, fecha y horario.</p>
          </div>

          <form action={createMemberBookingAction} className="space-y-6">
            <input type="hidden" name="startsAt" value={startsAtStr} />
            <input type="hidden" name="endsAt" value={endsAtStr} />

            <div className="space-y-3">
              <Label htmlFor="spaceId" className="text-sm font-semibold">
                1. Que espacio buscas?
              </Label>
              <div className="relative">
                <select
                  id="spaceId"
                  name="spaceId"
                  className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={selectedSpaceId}
                  onChange={(event) => {
                    setSelectedSpaceId(event.target.value);
                    setSelectedDate("");
                    setSelectedStartTime("");
                    setDurationHours(0);
                  }}
                  required
                >
                  <option value="" disabled>
                    Selecciona un espacio...
                  </option>
                  {spaceOptions.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name} ({space.hourlyQuotaCost} cupos/h)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            </div>

            {selectedSpace && (
              <div className="animate-in space-y-3 fade-in slide-in-from-top-2">
                <Label htmlFor="date" className="text-sm font-semibold">
                  2. Que dia quieres ir?
                </Label>
                <div className="relative">
                  <select
                    id="date"
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedStartTime("");
                    }}
                    required
                  >
                    <option value="" disabled>
                      Elige una fecha habilitada...
                    </option>
                    {dateOptions.map((date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const isAvail = isDateAvailable(dateStr, selectedSpace.availabilityRules);
                      const displayStr = capitalize(format(date, "EEEE d 'de' MMMM", { locale: es }));

                      return (
                        <option
                          key={dateStr}
                          value={dateStr}
                          disabled={!isAvail}
                          className={
                            isAvail
                              ? "py-1 font-medium text-foreground"
                              : "hidden text-muted-foreground/50 lg:block"
                          }
                        >
                          {displayStr} {isAvail ? "" : "(No disponible)"}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}

            {selectedSpace && selectedDate && (
              <div className="animate-in grid gap-5 fade-in slide-in-from-top-2 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="startTime" className="text-sm font-semibold">
                    3. Horario de inicio
                  </Label>
                  <select
                    id="startTime"
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={selectedStartTime}
                    onChange={(event) => setSelectedStartTime(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Seleccionar hora
                    </option>
                    {startTimeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="duration" className="text-sm font-semibold">
                    4. Duracion (horas)
                  </Label>
                  <select
                    id="duration"
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={durationHours || ""}
                    onChange={(event) => setDurationHours(parseInt(event.target.value, 10))}
                    required
                  >
                    <option value="" disabled>
                      Seleccionar duracion
                    </option>
                    {Array.from({
                      length: selectedSpace.maxBookingHours - selectedSpace.minBookingHours + 1,
                    }).map((_, index) => {
                      const hours = selectedSpace.minBookingHours + index;
                      return (
                        <option key={hours} value={hours}>
                          {hours} {hours === 1 ? "hora" : "horas"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            {startsAtStr && endsAtStr && (
              <div className="animate-in pt-4 fade-in zoom-in-95">
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-xl px-8 text-base sm:w-auto"
                >
                  Confirmar esta reserva
                </Button>
                <p className="mt-3 flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  El sistema verificara que este horario exacto no este ocupado por otra persona.
                </p>
              </div>
            )}
          </form>
        </div>

        <div className="flex flex-col items-center justify-center border-t border-border/60 bg-muted/30 p-6 text-center md:border-l md:border-t-0 md:p-8">
          {selectedSpace ? (
            <div className="animate-in w-full max-w-[240px] space-y-4 fade-in">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border/60 bg-muted">
                {selectedSpace.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedSpace.imageUrl}
                    alt={selectedSpace.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">{selectedSpace.name}</h4>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <div className="flex h-6 items-center rounded-md bg-primary/10 px-2 text-xs font-semibold text-primary">
                    {selectedSpace.hourlyQuotaCost} cupos / hora
                  </div>
                </div>
              </div>

              {durationHours > 0 && selectedStartTime && (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Costo total a debitar
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {quotaCost} <span className="text-sm font-medium text-muted-foreground">cupos</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-[200px] text-center opacity-60">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <CalendarIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Selecciona un espacio en el formulario para empezar
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
