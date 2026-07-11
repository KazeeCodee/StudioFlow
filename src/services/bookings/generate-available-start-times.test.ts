import { describe, expect, it } from "vitest";
import { parseStudioDateTimeInput } from "@/lib/datetime";
import { generateAvailableStartTimes } from "@/services/bookings/generate-available-start-times";

const splitMonday = [
  { dayOfWeek: 1, startTime: "08:00:00", endTime: "12:00:00", isActive: true },
  { dayOfWeek: 1, startTime: "14:00:00", endTime: "22:00:00", isActive: true },
];

function interval(startsAt: string, endsAt: string) {
  return {
    startsAt: parseStudioDateTimeInput(startsAt),
    endsAt: parseStudioDateTimeInput(endsAt),
  };
}

describe("generateAvailableStartTimes", () => {
  it("genera horas enteras que caben por completo en cada rango", () => {
    expect(
      generateAvailableStartTimes({
        date: "2026-04-06",
        durationHours: 2,
        availabilityRules: splitMonday,
        blocks: [],
        bookings: [],
        bookingBufferHours: 0,
      }),
    ).toEqual([
      "08:00",
      "09:00",
      "10:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
    ]);
  });

  it("elimina candidatos que se superponen con un bloqueo", () => {
    const result = generateAvailableStartTimes({
      date: "2026-04-06",
      durationHours: 2,
      availabilityRules: splitMonday,
      blocks: [interval("2026-04-06T15:00", "2026-04-06T17:00")],
      bookings: [],
      bookingBufferHours: 0,
    });

    expect(result).not.toEqual(expect.arrayContaining(["14:00", "15:00", "16:00"]));
    expect(result).toContain("17:00");
  });

  it("aplica el buffer alrededor del candidato al comparar reservas", () => {
    const result = generateAvailableStartTimes({
      date: "2026-04-06",
      durationHours: 2,
      availabilityRules: splitMonday,
      blocks: [],
      bookings: [interval("2026-04-06T17:00", "2026-04-06T18:00")],
      bookingBufferHours: 1,
    });

    expect(result).toContain("14:00");
    expect(result).not.toEqual(expect.arrayContaining(["15:00", "16:00", "17:00", "18:00"]));
    expect(result).toContain("19:00");
  });

  it("devuelve una lista vacia cuando el espacio no opera ese dia", () => {
    expect(
      generateAvailableStartTimes({
        date: "2026-04-07",
        durationHours: 2,
        availabilityRules: splitMonday,
        blocks: [],
        bookings: [],
        bookingBufferHours: 0,
      }),
    ).toEqual([]);
  });
});
