"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { formatStudioDate, formatStudioTime } from "@/lib/datetime";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    type: "booking" | "block";
    status?: string;
    resourceLabel: string;
    secondaryLabel?: string;
  };
};

type BookingsCalendarProps = {
  events: CalendarEvent[];
};

function getEventClassName(type: CalendarEvent["extendedProps"]["type"]) {
  return type === "block"
    ? "rounded-lg border border-amber-300/70 bg-amber-100/80 px-1 py-0.5 text-amber-900"
    : "rounded-lg border border-emerald-300/70 bg-emerald-100/80 px-1 py-0.5 text-emerald-900";
}

export function BookingsCalendar({ events }: BookingsCalendarProps) {
  return (
    <div className="space-y-5">
      <Card className="rounded-[28px] border-border/70">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Calendario general</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Reservas confirmadas y bloqueos del estudio en una sola vista semanal o mensual.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-emerald-300/70 bg-emerald-100/80 text-emerald-900"
            >
              Reservas
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full border-amber-300/70 bg-amber-100/80 text-amber-900"
            >
              Bloqueos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="studio-calendar overflow-hidden rounded-[24px] border border-border/70 bg-background p-3">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Dia",
              }}
              allDaySlot={false}
              locale="es"
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="24:00:00"
              weekends
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
              events={events}
              eventContent={(arg) => (
                <div className={cn("fc-event-main-frame space-y-0.5", getEventClassName(arg.event.extendedProps.type))}>
                  <p className="truncate text-xs font-semibold">{arg.event.title}</p>
                  <p className="truncate text-[11px] opacity-80">
                    {arg.event.extendedProps.secondaryLabel}
                  </p>
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-border/70">
        <CardHeader>
          <CardTitle>Agenda en lista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay reservas ni bloqueos para los filtros actuales.
            </p>
          ) : (
            events.map((event) => (
              <article
                key={event.id}
                className="grid gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 md:grid-cols-[140px_1fr_auto]"
              >
                <div className="text-sm text-muted-foreground">
                  <p>{formatStudioDate(new Date(event.start))}</p>
                  <p>
                    {formatStudioTime(new Date(event.start))} - {formatStudioTime(new Date(event.end))}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.extendedProps.resourceLabel}
                    {event.extendedProps.secondaryLabel ? ` · ${event.extendedProps.secondaryLabel}` : ""}
                  </p>
                </div>
                <div className="md:self-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full",
                      event.extendedProps.type === "block"
                        ? "border-amber-300/70 bg-amber-100/80 text-amber-900"
                        : "border-emerald-300/70 bg-emerald-100/80 text-emerald-900",
                    )}
                  >
                    {event.extendedProps.type === "block" ? "Bloqueo" : "Reserva"}
                  </Badge>
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
