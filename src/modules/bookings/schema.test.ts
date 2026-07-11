import { describe, expect, it } from "vitest";
import { bookingAvailabilityQuerySchema } from "@/modules/bookings/schema";

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
});
