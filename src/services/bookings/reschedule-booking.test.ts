import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedProfile } from "@/modules/auth/types";

const getBookingForReschedule = vi.fn();
const getOverlappingBookingsExcludingCurrent = vi.fn();
const getOverlappingBookings = vi.fn();
const getOverlappingSpaceBlocks = vi.fn();
const getOperationalSettings = vi.fn();
const getSpaceBookingContext = vi.fn();

const bookingUpdateWhere = vi.fn();
const bookingUpdateSet = vi.fn(() => ({ where: bookingUpdateWhere }));
const memberPlanUpdateWhere = vi.fn();
const memberPlanUpdateSet = vi.fn(() => ({ where: memberPlanUpdateWhere }));
const insertValues = vi.fn(() => ({ returning: async () => [{ id: "booking-1" }] }));
const insertNoReturnValues = vi.fn(() => ({}));

const tx = {
  update: vi.fn(),
  insert: vi.fn(() => ({
    values: (...args: unknown[]) => {
      if (tx.insert.mock.calls.length === 1) {
        return insertValues(...args);
      }

      return insertNoReturnValues(...args);
    },
  })),
};

const transaction = vi.fn(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx));
const getDb = vi.fn(() => ({
  transaction,
}));

vi.mock("@/lib/db", () => ({
  getDb,
}));

vi.mock("@/modules/bookings/queries", () => ({
  getBookingForReschedule,
  getOverlappingBookingsExcludingCurrent,
  getOverlappingBookings,
  getOverlappingSpaceBlocks,
  getSpaceBookingContext,
}));

vi.mock("@/modules/settings/queries", () => ({
  getOperationalSettings,
}));

describe("rescheduleBooking", () => {
  const actor: AuthenticatedProfile = {
    id: "profile-1",
    email: "ana@studioflow.com",
    fullName: "Ana Perez",
    role: "member",
    status: "active",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tx.update
      .mockImplementationOnce(() => ({ set: bookingUpdateSet }))
      .mockImplementationOnce(() => ({ set: memberPlanUpdateSet }));
    getBookingForReschedule.mockResolvedValue({
      id: "booking-1",
      memberId: "member-1",
      memberProfileId: "profile-1",
      memberPlanId: "plan-1",
      spaceId: "space-1",
      startsAt: new Date("2026-04-04T12:00:00Z"),
      endsAt: new Date("2026-04-04T14:00:00Z"),
      durationHours: 2,
      status: "confirmed",
      quotaConsumed: 4,
      memberPlanQuotaRemaining: 10,
      memberPlanQuotaUsed: 5,
      cancellationPolicyHours: 24,
    });
    getSpaceBookingContext.mockResolvedValue({
      id: "space-1",
      name: "Sala Podcast",
      status: "active",
      hourlyQuotaCost: 2,
      minBookingHours: 1,
      maxBookingHours: 4,
      availabilityRules: [
        {
          dayOfWeek: 6,
          startTime: "09:00:00",
          endTime: "18:00:00",
          isActive: true,
        },
      ],
    });
    getOperationalSettings.mockResolvedValue({
      bookingBufferHours: 0,
    });
    getOverlappingBookingsExcludingCurrent.mockResolvedValue([]);
    getOverlappingBookings.mockResolvedValue([]);
    getOverlappingSpaceBlocks.mockResolvedValue([]);
  });

  it("reprograma con reintegro previo cuando sigue fuera del cutoff", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T08:00:00Z"));

    const { rescheduleBooking } = await import("@/services/bookings/reschedule-booking");
    await rescheduleBooking(
      {
        bookingId: "booking-1",
        startsAt: "2026-04-04T15:00",
        endsAt: "2026-04-04T18:00",
        reason: "Cambio de agenda",
      },
      actor,
    );

    expect(memberPlanUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        quotaRemaining: 8,
        quotaUsed: 7,
      }),
    );

    vi.useRealTimers();
  });

  it("bloquea la reprogramacion si un miembro intenta operar sobre otra reserva", async () => {
    getBookingForReschedule.mockResolvedValueOnce({
      id: "booking-1",
      memberProfileId: "someone-else",
      startsAt: new Date("2026-04-04T12:00:00Z"),
      status: "confirmed",
    });

    const { rescheduleBooking } = await import("@/services/bookings/reschedule-booking");

    await expect(
      rescheduleBooking(
        {
          bookingId: "booking-1",
          startsAt: "2026-04-04T15:00",
          endsAt: "2026-04-04T17:00",
        },
        actor,
      ),
    ).rejects.toThrow("No podés reprogramar reservas de otro miembro.");
  });
});
