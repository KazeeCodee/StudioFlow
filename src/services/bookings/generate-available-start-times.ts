import {
  getStudioDateTimeParts,
  parseStudioDateTimeInput,
} from "@/lib/datetime";
import {
  applyBookingBuffer,
  hasOverlap,
  type BookingInterval,
} from "@/services/bookings/check-availability";

type AvailabilityRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type GenerateAvailableStartTimesInput = {
  date: string;
  durationHours: number;
  availabilityRules: AvailabilityRule[];
  blocks: BookingInterval[];
  bookings: BookingInterval[];
  bookingBufferHours: number;
};

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function generateAvailableStartTimes({
  date,
  durationHours,
  availabilityRules,
  blocks,
  bookings,
  bookingBufferHours,
}: GenerateAvailableStartTimesInput) {
  const dayOfWeek = getStudioDateTimeParts(parseStudioDateTimeInput(`${date}T12:00`)).dayOfWeek;
  const durationMinutes = durationHours * 60;
  const startTimes = new Set<string>();

  for (const rule of availabilityRules.filter(
    (item) => item.isActive && item.dayOfWeek === dayOfWeek,
  )) {
    const firstWholeHour = Math.ceil(parseTimeToMinutes(rule.startTime) / 60) * 60;
    const lastStart = parseTimeToMinutes(rule.endTime) - durationMinutes;

    for (let startMinutes = firstWholeHour; startMinutes <= lastStart; startMinutes += 60) {
      const startTime = minutesToTime(startMinutes);
      const startsAt = parseStudioDateTimeInput(`${date}T${startTime}`);
      const endsAt = new Date(startsAt.getTime() + durationHours * 3_600_000);
      const candidate = { startsAt, endsAt };

      if (hasOverlap(candidate, blocks)) {
        continue;
      }

      if (hasOverlap(applyBookingBuffer(candidate, bookingBufferHours), bookings)) {
        continue;
      }

      startTimes.add(startTime);
    }
  }

  return [...startTimes].sort();
}
