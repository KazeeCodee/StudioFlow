import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedProfile } from "@/modules/auth/types";

const getActiveMemberPlan = vi.fn();
const getMemberByProfileId = vi.fn();
const getOverlappingBookings = vi.fn();
const getOverlappingSpaceBlocks = vi.fn();
const getSpaceBookingContext = vi.fn();
const getOperationalSettings = vi.fn();

const returning = vi.fn(async () => [{ id: "booking-1" }]);
const values = vi.fn(() => ({ returning }));
const where = vi.fn(() => ({ returning }));
const set = vi.fn(() => ({ where }));
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
vi.mock("@/modules/bookings/queries", () => ({
  getActiveMemberPlan,
  getMemberByProfileId,
  getOverlappingBookings,
  getOverlappingSpaceBlocks,
  getSpaceBookingContext,
}));
vi.mock("@/modules/settings/queries", () => ({ getOperationalSettings }));

describe("createBooking", () => {
  const actor: AuthenticatedProfile = {
    id: "00000000-0000-4000-8000-000000000201",
    email: "admin@studioflow.invalid",
    fullName: "Admin Test",
    role: "admin",
    status: "active",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getActiveMemberPlan.mockResolvedValue({
      id: "plan-1",
      endsAt: new Date("2026-09-01T00:00:00Z"),
      quotaUsed: 0,
      quotaRemaining: 10,
    });
    getSpaceBookingContext.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000203",
      status: "active",
      hourlyQuotaCost: 1,
      minBookingHours: 1,
      maxBookingHours: 8,
      availabilityRules: [
        {
          dayOfWeek: 1,
          startTime: "00:00:00",
          endTime: "23:59:00",
          isActive: true,
        },
      ],
    });
    getOperationalSettings.mockResolvedValue({ bookingBufferHours: 0 });
    getOverlappingBookings.mockResolvedValue([]);
    getOverlappingSpaceBlocks.mockResolvedValue([]);
  });

  it("abre la transaccion antes de leer plan, espacio y disponibilidad", async () => {
    const { createBooking } = await import("@/services/bookings/create-booking");

    await createBooking(
      {
        memberId: "00000000-0000-4000-8000-000000000202",
        spaceId: "00000000-0000-4000-8000-000000000203",
        startsAt: "2026-08-03T10:00",
        endsAt: "2026-08-03T11:00",
      },
      actor,
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(transaction.mock.invocationCallOrder[0]).toBeLessThan(
      getActiveMemberPlan.mock.invocationCallOrder[0],
    );
    expect(getActiveMemberPlan).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000202",
      tx,
    );
    expect(getSpaceBookingContext).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000203",
      tx,
    );
  });
});
