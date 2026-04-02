export const STUDIO_LOCALE = "es-AR";
export const STUDIO_TIME_ZONE = "America/Argentina/Buenos_Aires";

type StudioDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number;
};

const dateTimePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STUDIO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  weekday: "short",
});

const studioDayOfWeekMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function parseDateTimeParts(date: Date) {
  const parts = dateTimePartsFormatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) =>
        ["year", "month", "day", "hour", "minute", "second"].includes(part.type),
      )
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function getTimeZoneOffsetMilliseconds(date: Date) {
  const parts = parseDateTimeParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

export function parseStudioDateTimeInput(value: string) {
  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) {
    throw new Error("Fecha invalida.");
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) {
    throw new Error("Fecha invalida.");
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMilliseconds = getTimeZoneOffsetMilliseconds(utcGuess);

  return new Date(utcGuess.getTime() - offsetMilliseconds);
}

export function getStudioDateTimeParts(date: Date): StudioDateTimeParts {
  const parts = parseDateTimeParts(date);
  const weekdayLabel = weekdayFormatter.format(date);
  const dayOfWeek = studioDayOfWeekMap[weekdayLabel];

  if (dayOfWeek === undefined) {
    throw new Error(`Dia de semana invalido: ${weekdayLabel}`);
  }

  return {
    ...parts,
    dayOfWeek,
  };
}

export function getStudioMinutesSinceMidnight(date: Date) {
  const { hour, minute } = getStudioDateTimeParts(date);
  return hour * 60 + minute;
}

export function isSameStudioDay(firstDate: Date, secondDate: Date) {
  const firstParts = getStudioDateTimeParts(firstDate);
  const secondParts = getStudioDateTimeParts(secondDate);

  return (
    firstParts.year === secondParts.year &&
    firstParts.month === secondParts.month &&
    firstParts.day === secondParts.day
  );
}

export function formatStudioDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  },
) {
  return new Intl.DateTimeFormat(STUDIO_LOCALE, {
    timeZone: STUDIO_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatStudioDayMonth(date: Date) {
  return formatStudioDate(date, {
    day: "2-digit",
    month: "short",
  });
}

export function formatStudioTime(date: Date) {
  return formatStudioDate(date, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function formatStudioDateTime(date: Date) {
  return formatStudioDate(date, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

export function formatStudioDateTimeInputValue(date: Date) {
  const { year, month, day, hour, minute } = getStudioDateTimeParts(date);

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour
    .toString()
    .padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}
