import { describe, expect, it } from "vitest";
import {
  applyBookingBuffer,
  hasOverlap,
} from "@/services/bookings/check-availability";

describe("hasOverlap", () => {
  it("detecta solapamientos del mismo espacio", () => {
    const result = hasOverlap(
      {
        startsAt: new Date("2026-04-01T10:00:00Z"),
        endsAt: new Date("2026-04-01T12:00:00Z"),
      },
      [
        {
          startsAt: new Date("2026-04-01T11:00:00Z"),
          endsAt: new Date("2026-04-01T13:00:00Z"),
        },
      ],
    );

    expect(result).toBe(true);
  });

  it("considera el buffer operativo entre reservas", () => {
    const bufferedTarget = applyBookingBuffer(
      {
        startsAt: new Date("2026-04-01T11:00:00Z"),
        endsAt: new Date("2026-04-01T12:00:00Z"),
      },
      1,
    );

    const result = hasOverlap(bufferedTarget, [
      {
        startsAt: new Date("2026-04-01T10:00:00Z"),
        endsAt: new Date("2026-04-01T11:00:00Z"),
      },
    ]);

    expect(result).toBe(true);
  });
});
