import { describe, expect, it } from "vitest";
import { calculateBookingQuota } from "@/services/bookings/calculate-booking-quota";

describe("calculateBookingQuota", () => {
  it("multiplica horas por costo horario del espacio", () => {
    expect(calculateBookingQuota({ durationHours: 2, hourlyQuotaCost: 3 })).toBe(6);
  });
});
