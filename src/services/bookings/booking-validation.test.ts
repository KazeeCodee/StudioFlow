import { describe, expect, it } from "vitest";
import {
  assertWithinAvailability,
  validateBookingWindow,
} from "@/services/bookings/booking-validation";

const splitMonday = [
  { dayOfWeek: 1, startTime: "08:00:00", endTime: "12:00:00", isActive: true },
  { dayOfWeek: 1, startTime: "14:00:00", endTime: "22:00:00", isActive: true },
];

describe("validateBookingWindow", () => {
  it("interpreta los datetime-local con la zona horaria del estudio", () => {
    const result = validateBookingWindow("2026-04-01T10:00", "2026-04-01T12:00");

    expect(result.durationHours).toBe(2);
    expect(result.startsAt.toISOString()).toBe("2026-04-01T13:00:00.000Z");
    expect(result.endsAt.toISOString()).toBe("2026-04-01T15:00:00.000Z");
  });

  it("rechaza reservas que cruzan de dia en horario del estudio", () => {
    expect(() =>
      validateBookingWindow("2026-04-01T23:00", "2026-04-02T01:00"),
    ).toThrow(/mismo dia/i);
  });

  it.each([
    ["2026-04-06T08:00", "2026-04-06T12:00"],
    ["2026-04-06T15:00", "2026-04-06T18:00"],
  ])("acepta una reserva contenida en cualquiera de los rangos", (start, end) => {
    const window = validateBookingWindow(start, end);

    expect(() =>
      assertWithinAvailability({ ...window, availabilityRules: splitMonday }),
    ).not.toThrow();
  });

  it.each([
    ["2026-04-06T11:00", "2026-04-06T15:00"],
    ["2026-04-06T12:00", "2026-04-06T14:00"],
  ])("rechaza una reserva en la pausa o que la atraviesa", (start, end) => {
    const window = validateBookingWindow(start, end);

    expect(() =>
      assertWithinAvailability({ ...window, availabilityRules: splitMonday }),
    ).toThrow(/fuera del horario/i);
  });
});
