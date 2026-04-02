import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs, bookingStatusHistory, bookings, memberPlans } from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";
import { getBookingForCancellation } from "@/modules/bookings/queries";
import { getBookingPenaltyOutcome } from "@/services/bookings/booking-penalty";

export async function cancelBooking(
  {
    bookingId,
    reason,
  }: {
    bookingId: string;
    reason?: string;
  },
  actor: AuthenticatedProfile,
) {
  const booking = await getBookingForCancellation(bookingId);

  if (!booking) {
    throw new Error("La reserva no existe.");
  }

  if (
    actor.role === "member" &&
    (!booking.memberProfileId || booking.memberProfileId !== actor.id)
  ) {
    throw new Error("No podes cancelar reservas de otro miembro.");
  }

  if (
    booking.status === "cancelled_by_user" ||
    booking.status === "cancelled_by_admin"
  ) {
    throw new Error("La reserva ya fue cancelada.");
  }

  if (booking.startsAt <= new Date()) {
    throw new Error("Solo se pueden cancelar reservas futuras.");
  }

  const penalty = getBookingPenaltyOutcome({
    policyHours: booking.cancellationPolicyHours ?? 24,
    startsAt: booking.startsAt,
  });
  const newStatus = actor.role === "member" ? "cancelled_by_user" : "cancelled_by_admin";

  const db = getDb();

  return db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: newStatus,
        cancellationReason: reason ?? null,
        cancelledAt: new Date(),
        cancelledBy: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    if (penalty.shouldRefund && booking.memberPlanId) {
      await tx
        .update(memberPlans)
        .set({
          quotaRemaining: (booking.memberPlanQuotaRemaining ?? 0) + booking.quotaConsumed,
          quotaUsed: Math.max((booking.memberPlanQuotaUsed ?? 0) - booking.quotaConsumed, 0),
          updatedBy: actor.id,
          updatedAt: new Date(),
        })
        .where(eq(memberPlans.id, booking.memberPlanId));
    }

    await tx.insert(bookingStatusHistory).values({
      bookingId: booking.id,
      oldStatus: booking.status,
      newStatus,
      changedBy: actor.id,
      note: penalty.shouldRefund
        ? "Reserva cancelada con reintegro de cupos"
        : "Reserva cancelada sin reintegro por politica",
    });

    await tx.insert(auditLogs).values({
      actorId: actor.id,
      actorRole: actor.role,
      action: "booking.cancelled",
      entityType: "booking",
      entityId: booking.id,
      metadata: {
        refundedQuota: penalty.shouldRefund,
        quotaConsumed: booking.quotaConsumed,
      },
    });

    return {
      bookingId: booking.id,
      status: newStatus,
      refundedQuota: penalty.shouldRefund,
    };
  });
}
