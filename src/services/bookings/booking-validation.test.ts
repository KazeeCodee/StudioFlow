import { describe, expect, it } from "vitest";
import { validateBookingWindow } from "@/services/bookings/booking-validation";

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
});
