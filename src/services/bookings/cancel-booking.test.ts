import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedProfile } from "@/modules/auth/types";

const getBookingForCancellation = vi.fn();
const returning = vi.fn(async () => [{ id: "booking-1" }]);
const where = vi.fn(() => ({ returning }));
const set = vi.fn(() => ({ where }));
const values = vi.fn(() => ({}));
const tx = {
  execute: vi.fn(),
  insert: vi.fn(() => ({ values })),
  update: vi.fn(() => ({ set })),
};
const transaction = vi.fn(async (callback: (executor: typeof tx) => Promise<unknown>) =>
  callback(tx),
);
const getDb = vi.fn(() => ({ transaction }));

vi.mock("@/lib/db", () => ({ getDb }));
vi.mock("@/modules/bookings/queries", () => ({ getBookingForCancellation }));

describe("cancelBooking", () => {
  const actor: AuthenticatedProfile = {
    id: "profile-1",
    email: "admin@studioflow.invalid",
    fullName: "Admin Test",
    role: "admin",
    status: "active",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getBookingForCancellation.mockResolvedValue({
      id: "booking-1",
      memberId: "member-1",
      memberPlanId: "member-plan-1",
      startsAt: new Date("2026-08-03T13:00:00Z"),
      status: "confirmed",
      quotaConsumed: 1,
      cancellationPolicyHours: 24,
      memberPlanQuotaRemaining: 9,
      memberPlanQuotaUsed: 1,
    });
  });

  it("bloquea y relee la reserva dentro de la transaccion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T12:00:00Z"));
    const { cancelBooking } = await import("@/services/bookings/cancel-booking");

    await cancelBooking({ bookingId: "booking-1" }, actor);

    expect(transaction.mock.invocationCallOrder[0]).toBeLessThan(
      getBookingForCancellation.mock.invocationCallOrder[0],
    );
    expect(getBookingForCancellation).toHaveBeenCalledWith("booking-1", tx);
    vi.useRealTimers();
  });
});
