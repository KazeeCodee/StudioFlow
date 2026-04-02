import { describe, expect, it } from "vitest";
import {
  getBookingPenaltyOutcome,
  getRescheduleQuotaDelta,
} from "@/services/bookings/booking-penalty";

describe("getBookingPenaltyOutcome", () => {
  it("reintegra cupos cuando la accion ocurre antes de la ventana de penalizacion", () => {
    const result = getBookingPenaltyOutcome({
      now: new Date("2026-04-01T10:00:00Z"),
      policyHours: 24,
      startsAt: new Date("2026-04-02T12:00:00Z"),
    });

    expect(result.shouldRefund).toBe(true);
    expect(result.hoursUntilStart).toBe(26);
  });

  it("no reintegra cupos cuando la accion ocurre dentro de la ventana de penalizacion", () => {
    const result = getBookingPenaltyOutcome({
      now: new Date("2026-04-01T14:00:00Z"),
      policyHours: 24,
      startsAt: new Date("2026-04-02T12:00:00Z"),
    });

    expect(result.shouldRefund).toBe(false);
    expect(result.hoursUntilStart).toBe(22);
  });
});

describe("getRescheduleQuotaDelta", () => {
  it("antes del cutoff descuenta solo la diferencia entre reserva vieja y nueva", () => {
    const result = getRescheduleQuotaDelta({
      newQuotaConsumed: 3,
      oldQuotaConsumed: 2,
      shouldRefund: true,
    });

    expect(result.quotaRemainingDelta).toBe(-1);
    expect(result.quotaUsedDelta).toBe(1);
  });

  it("despues del cutoff suma el consumo nuevo encima del ya penalizado", () => {
    const result = getRescheduleQuotaDelta({
      newQuotaConsumed: 3,
      oldQuotaConsumed: 2,
      shouldRefund: false,
    });

    expect(result.quotaRemainingDelta).toBe(-3);
    expect(result.quotaUsedDelta).toBe(3);
  });
});
