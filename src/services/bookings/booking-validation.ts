import {
  getStudioDateTimeParts,
  getStudioMinutesSinceMidnight,
  isSameStudioDay,
  parseStudioDateTimeInput,
} from "@/lib/datetime";

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function validateBookingWindow(startsAtInput: string, endsAtInput: string) {
  const startsAt = parseStudioDateTimeInput(startsAtInput);
  const endsAt = parseStudioDateTimeInput(endsAtInput);

  if (endsAt <= startsAt) {
    throw new Error("El fin debe ser posterior al inicio.");
  }

  if (
    startsAt.getUTCMinutes() !== 0 ||
    endsAt.getUTCMinutes() !== 0 ||
    startsAt.getUTCSeconds() !== 0 ||
    endsAt.getUTCSeconds() !== 0
  ) {
    throw new Error("Las reservas deben comenzar y terminar en horas enteras.");
  }

  if (!isSameStudioDay(startsAt, endsAt)) {
    throw new Error("La reserva debe quedar dentro del mismo dia.");
  }

  const durationHours = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;

  if (!Number.isInteger(durationHours) || durationHours <= 0) {
    throw new Error("La reserva debe durar una cantidad entera de horas.");
  }

  return {
    startsAt,
    endsAt,
    durationHours,
  };
}

export function assertWithinAvailability({
  startsAt,
  endsAt,
  availabilityRules,
}: {
  startsAt: Date;
  endsAt: Date;
  availabilityRules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[];
}) {
  const dayOfWeek = getStudioDateTimeParts(startsAt).dayOfWeek;
  const rule = availabilityRules.find((item) => item.dayOfWeek === dayOfWeek && item.isActive);

  if (!rule) {
    throw new Error("El espacio no opera en el dia seleccionado.");
  }

  const bookingStart = getStudioMinutesSinceMidnight(startsAt);
  const bookingEnd = getStudioMinutesSinceMidnight(endsAt);
  const ruleStart = parseTimeToMinutes(rule.startTime);
  const ruleEnd = parseTimeToMinutes(rule.endTime);

  if (bookingStart < ruleStart || bookingEnd > ruleEnd) {
    throw new Error("La reserva queda fuera del horario disponible del espacio.");
  }
}
