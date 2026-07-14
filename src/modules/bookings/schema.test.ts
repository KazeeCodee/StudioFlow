import { describe, expect, it } from "vitest";
import {
  bookingAvailabilityQuerySchema,
  cancellationSchema,
} from "@/modules/bookings/schema";

describe("bookingAvailabilityQuerySchema", () => {
  it("acepta fecha de estudio y duracion entera", () => {
    expect(
      bookingAvailabilityQuerySchema.parse({ date: "2026-04-06", durationHours: "2" }),
    ).toEqual({ date: "2026-04-06", durationHours: 2 });
  });

  it.each([
    { date: "06-04-2026", durationHours: "2" },
    { date: "2026-04-06", durationHours: "1.5" },
    { date: "2026-04-06", durationHours: "0" },
  ])("rechaza consultas invalidas", (input) => {
    expect(bookingAvailabilityQuerySchema.safeParse(input).success).toBe(false);
  });

  it("descarta redirects externos de cancelacion", () => {
    const result = cancellationSchema.parse({
      bookingId: "00000000-0000-4000-8000-000000000401",
      redirectTo: "https://evil.example/phishing",
    });

    expect(result.redirectTo).toBeUndefined();
  });
});
