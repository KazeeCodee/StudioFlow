import {
  getStudioDateTimeParts,
  parseStudioDateTimeInput,
} from "@/lib/datetime";

export type RenewalUrgency =
  | "overdue"
  | "due_today"
  | "due_soon"
  | "future";

function getStudioDayNumber(date: Date) {
  const { year, month, day } = getStudioDateTimeParts(date);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function getStudioMidnight(date: Date, daysToAdd = 0) {
  const { year, month, day } = getStudioDateTimeParts(date);
  const shifted = new Date(Date.UTC(year, month - 1, day + daysToAdd));
  const shiftedYear = shifted.getUTCFullYear();
  const shiftedMonth = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const shiftedDay = String(shifted.getUTCDate()).padStart(2, "0");

  return parseStudioDateTimeInput(
    `${shiftedYear}-${shiftedMonth}-${shiftedDay}T00:00`,
  );
}

export function getRenewalQueueBoundaries(now: Date, renewalWindowDays: number) {
  return {
    todayStart: getStudioMidnight(now),
    tomorrowStart: getStudioMidnight(now, 1),
    pendingEndExclusive: getStudioMidnight(now, renewalWindowDays + 1),
  };
}

export function formatRenewalRelativeDay(dueAt: Date, now: Date) {
  const daysUntilDue = getStudioDayNumber(dueAt) - getStudioDayNumber(now);

  if (daysUntilDue === 0) return "Hoy";
  if (daysUntilDue === 1) return "Mañana";
  if (daysUntilDue < 0) {
    const daysAgo = Math.abs(daysUntilDue);
    return `Hace ${daysAgo} ${daysAgo === 1 ? "día" : "días"}`;
  }

  return `En ${daysUntilDue} días`;
}

export function classifyRenewalUrgency(
  dueAt: Date,
  now: Date,
  renewalWindowDays: number,
): RenewalUrgency {
  const daysUntilDue = getStudioDayNumber(dueAt) - getStudioDayNumber(now);

  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue === 0) return "due_today";
  if (daysUntilDue <= renewalWindowDays) return "due_soon";
  return "future";
}
