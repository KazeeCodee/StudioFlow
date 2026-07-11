"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  availabilityRulesSchema,
  defaultAvailabilityRules,
  weekdayOptions,
} from "@/modules/spaces/schema";

export type AvailabilityRuleValue = {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
};

type EditableAvailabilityRule = AvailabilityRuleValue & { key: string };

type WeeklyAvailabilityEditorProps = {
  initialRules?: AvailabilityRuleValue[];
};

let rangeSequence = 0;

function createKey() {
  rangeSequence += 1;
  return `availability-range-${rangeSequence}`;
}

function normalizeRules(initialRules: AvailabilityRuleValue[] | undefined) {
  const source = initialRules === undefined ? defaultAvailabilityRules : initialRules;

  return source
    .filter((rule) => rule.isActive)
    .map((rule) => ({
      ...rule,
      isActive: true,
      startTime: rule.startTime.slice(0, 5),
      endTime: rule.endTime.slice(0, 5),
      key: createKey(),
    }));
}

function minutesToTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function createAvailableRange(dayOfWeek: number, ranges: EditableAvailabilityRule[]) {
  const occupied = ranges
    .filter((rule) => rule.dayOfWeek === dayOfWeek)
    .map((rule) => ({ start: timeToMinutes(rule.startTime), end: timeToMinutes(rule.endTime) }));
  const preferredHours = [
    ...Array.from({ length: 14 }, (_, index) => index + 9),
    ...Array.from({ length: 9 }, (_, index) => index),
  ];
  const availableHour = preferredHours.find((hour) => {
    const start = hour * 60;
    const end = start + 60;
    return end <= 23 * 60 && !occupied.some((range) => start < range.end && end > range.start);
  });
  const startMinutes = (availableHour ?? 9) * 60;

  return {
    key: createKey(),
    dayOfWeek,
    isActive: true,
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(startMinutes + 60),
  };
}

function createDefaultRange(dayOfWeek: number): EditableAvailabilityRule {
  return {
    key: createKey(),
    dayOfWeek,
    isActive: true,
    startTime: "09:00",
    endTime: "18:00",
  };
}

export function WeeklyAvailabilityEditor({ initialRules }: WeeklyAvailabilityEditorProps) {
  const [rules, setRules] = useState<EditableAvailabilityRule[]>(() => normalizeRules(initialRules));
  const serializedRules = useMemo(
    () =>
      rules
        .map(({ key: _key, ...rule }) => rule)
        .sort(
          (first, second) =>
            first.dayOfWeek - second.dayOfWeek || first.startTime.localeCompare(second.startTime),
        ),
    [rules],
  );
  const validation = availabilityRulesSchema.safeParse(serializedRules);
  const errorMessages = validation.success
    ? []
    : [...new Set(validation.error.issues.map((issue) => issue.message))];

  function toggleDay(dayOfWeek: number, enabled: boolean) {
    setRules((current) => {
      if (!enabled) {
        return current.filter((rule) => rule.dayOfWeek !== dayOfWeek);
      }
      return [...current, createDefaultRange(dayOfWeek)];
    });
  }

  function addRange(dayOfWeek: number) {
    setRules((current) => [...current, createAvailableRange(dayOfWeek, current)]);
  }

  function updateRange(key: string, field: "startTime" | "endTime", value: string) {
    setRules((current) =>
      current.map((rule) => (rule.key === key ? { ...rule, [field]: value } : rule)),
    );
  }

  function removeRange(key: string) {
    setRules((current) => current.filter((rule) => rule.key !== key));
  }

  return (
    <div className="space-y-4">
      <input
        data-testid="availability-rules-input"
        type="hidden"
        name="availabilityRules"
        value={JSON.stringify(serializedRules)}
      />
      <input
        data-testid="availability-validity"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        required
        value={validation.success ? "valid" : ""}
        onChange={() => undefined}
      />

      {errorMessages.length > 0 ? (
        <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessages.join(" ")}
        </div>
      ) : null}

      <div className="divide-y divide-border/60 rounded-xl border border-border/60">
        {weekdayOptions.map((day) => {
          const dayRules = rules
            .filter((rule) => rule.dayOfWeek === day.value)
            .sort((first, second) => first.startTime.localeCompare(second.startTime));
          const isOpen = dayRules.length > 0;

          return (
            <section key={day.value} className="space-y-3 p-4" aria-labelledby={`day-${day.value}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    id={`day-${day.value}-enabled`}
                    type="checkbox"
                    checked={isOpen}
                    onChange={(event) => toggleDay(day.value, event.target.checked)}
                    aria-label={`${day.label} abierto`}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <div>
                    <p id={`day-${day.value}`} className="text-sm font-semibold">
                      {day.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isOpen ? `${dayRules.length} horario${dayRules.length === 1 ? "" : "s"}` : "Cerrado"}
                    </p>
                  </div>
                </div>

                {isOpen ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addRange(day.value)}
                    aria-label={`Agregar horario para ${day.label}`}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar horario
                  </Button>
                ) : null}
              </div>

              {isOpen ? (
                <div className="space-y-2 sm:pl-7">
                  {dayRules.map((rule, index) => (
                    <div
                      key={rule.key}
                      data-testid={`availability-range-${day.value}`}
                      className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/35 p-3"
                    >
                      <div className="min-w-32 flex-1 space-y-1.5">
                        <Label htmlFor={`${rule.key}-start`}>Desde</Label>
                        <Input
                          id={`${rule.key}-start`}
                          type="time"
                          step={3600}
                          value={rule.startTime}
                          aria-label={`${day.label} horario ${index + 1} desde`}
                          onChange={(event) => updateRange(rule.key, "startTime", event.target.value)}
                        />
                      </div>
                      <div className="min-w-32 flex-1 space-y-1.5">
                        <Label htmlFor={`${rule.key}-end`}>Hasta</Label>
                        <Input
                          id={`${rule.key}-end`}
                          type="time"
                          step={3600}
                          value={rule.endTime}
                          aria-label={`${day.label} horario ${index + 1} hasta`}
                          onChange={(event) => updateRange(rule.key, "endTime", event.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRange(rule.key)}
                        aria-label={`Eliminar horario ${index + 1} de ${day.label}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground sm:pl-7">
                  {day.label} esta cerrado. Activalo para agregar horarios.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
