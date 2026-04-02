import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  bookingStatusHistory,
  bookings,
  memberPlans,
} from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";
import type { RescheduleInput } from "@/modules/bookings/schema";
import {
  getBookingForReschedule,
  getOverlappingBookingsExcludingCurrent,
  getOverlappingSpaceBlocks,
  getSpaceBookingContext,
} from "@/modules/bookings/queries";
import { getOperationalSettings } from "@/modules/settings/queries";
import {
  getBookingPenaltyOutcome,
  getRescheduleQuotaDelta,
} from "@/services/bookings/booking-penalty";
import { calculateBookingQuota } from "@/services/bookings/calculate-booking-quota";
import { applyBookingBuffer, hasOverlap } from "@/services/bookings/check-availability";
import {
  assertWithinAvailability,
  validateBookingWindow,
} from "@/services/bookings/booking-validation";

export async function rescheduleBooking(
  input: Omit<RescheduleInput, "redirectTo">,
  actor: AuthenticatedProfile,
) {
  const booking = await getBookingForReschedule(input.bookingId);

  if (!booking) {
    throw new Error("La reserva no existe.");
  }

  if (
    actor.role === "member" &&
    (!booking.memberProfileId || booking.memberProfileId !== actor.id)
  ) {
    throw new Error("No podés reprogramar reservas de otro miembro.");
  }

  if (booking.status !== "confirmed") {
    throw new Error("Solo se pueden reprogramar reservas confirmadas.");
  }

  if (booking.startsAt <= new Date()) {
    throw new Error("Solo se pueden reprogramar reservas futuras.");
  }

  if (!booking.memberPlanId) {
    throw new Error("La reserva no tiene un plan asociado para recalcular cupos.");
  }

  const memberPlanId = booking.memberPlanId;

  const { startsAt, endsAt, durationHours } = validateBookingWindow(
    input.startsAt,
    input.endsAt,
  );
  const [space, settings] = await Promise.all([
    getSpaceBookingContext(booking.spaceId),
    getOperationalSettings(),
  ]);

  if (!space) {
    throw new Error("El espacio asociado a la reserva no existe.");
  }

  if (space.status !== "active") {
    throw new Error("El espacio no está disponible para reprogramar.");
  }

  if (durationHours < space.minBookingHours || durationHours > space.maxBookingHours) {
    throw new Error("La duración no respeta los límites del espacio.");
  }

  assertWithinAvailability({
    startsAt,
    endsAt,
    availabilityRules: space.availabilityRules,
  });

  const bufferedInterval = applyBookingBuffer({ startsAt, endsAt }, settings.bookingBufferHours);
  const [blockingBlocks, conflictingBookings] = await Promise.all([
    getOverlappingSpaceBlocks(space.id, startsAt, endsAt),
    getOverlappingBookingsExcludingCurrent({
      bookingId: booking.id,
      endsAt: bufferedInterval.endsAt,
      spaceId: space.id,
      startsAt: bufferedInterval.startsAt,
    }),
  ]);

  if (blockingBlocks.length > 0) {
    throw new Error("Existe un bloqueo operativo en el nuevo horario.");
  }

  if (hasOverlap(bufferedInterval, conflictingBookings)) {
    throw new Error("El espacio ya tiene una reserva superpuesta en el nuevo horario.");
  }

  const newQuotaConsumed = calculateBookingQuota({
    durationHours,
    hourlyQuotaCost: space.hourlyQuotaCost,
  });
  const penalty = getBookingPenaltyOutcome({
    policyHours: booking.cancellationPolicyHours ?? 24,
    startsAt: booking.startsAt,
  });
  const quotaDelta = getRescheduleQuotaDelta({
    newQuotaConsumed,
    oldQuotaConsumed: booking.quotaConsumed,
    shouldRefund: penalty.shouldRefund,
  });
  const nextQuotaRemaining = (booking.memberPlanQuotaRemaining ?? 0) + quotaDelta.quotaRemainingDelta;
  const nextQuotaUsed = Math.max(
    (booking.memberPlanQuotaUsed ?? 0) + quotaDelta.quotaUsedDelta,
    0,
  );

  if (nextQuotaRemaining < 0) {
    throw new Error("El miembro no tiene cupos suficientes para reprogramar esta reserva.");
  }

  const db = getDb();
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        startsAt,
        endsAt,
        durationHours,
        hourlyQuotaCost: space.hourlyQuotaCost,
        quotaConsumed: newQuotaConsumed,
        updatedAt: now,
      })
      .where(eq(bookings.id, booking.id));

    await tx
      .update(memberPlans)
      .set({
        quotaRemaining: nextQuotaRemaining,
        quotaUsed: nextQuotaUsed,
        updatedBy: actor.id,
        updatedAt: now,
      })
      .where(eq(memberPlans.id, memberPlanId));

    await tx.insert(bookingStatusHistory).values({
      bookingId: booking.id,
      oldStatus: booking.status,
      newStatus: booking.status,
      changedBy: actor.id,
      note: penalty.shouldRefund
        ? "Reserva reprogramada con reintegro previo según política"
        : "Reserva reprogramada sin reintegro por política",
    });

    await tx.insert(auditLogs).values({
      actorId: actor.id,
      actorRole: actor.role,
      action: "booking.rescheduled",
      entityType: "booking",
      entityId: booking.id,
      metadata: {
        previousStartsAt: booking.startsAt,
        previousEndsAt: booking.endsAt,
        nextStartsAt: startsAt,
        nextEndsAt: endsAt,
        previousQuotaConsumed: booking.quotaConsumed,
        nextQuotaConsumed: newQuotaConsumed,
        refundedQuota: penalty.shouldRefund,
        reason: input.reason ?? null,
      },
    });

    return {
      bookingId: booking.id,
      refundedQuota: penalty.shouldRefund,
    };
  });
}
