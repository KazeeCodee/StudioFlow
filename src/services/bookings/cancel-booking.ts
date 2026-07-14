import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs, bookingStatusHistory, bookings, memberPlans } from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";
import { getBookingForCancellation } from "@/modules/bookings/queries";
import { getBookingPenaltyOutcome } from "@/services/bookings/booking-penalty";
import { lockBooking, lockMemberPlan } from "@/services/bookings/booking-transaction";

const cancellableStatuses = ["pending", "confirmed"] as const;

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
  const db = getDb();

  return db.transaction(async (tx) => {
    await lockBooking(tx, bookingId);
    const booking = await getBookingForCancellation(bookingId, tx);

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

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new Error("Solo se pueden cancelar reservas activas.");
    }

    if (booking.startsAt <= new Date()) {
      throw new Error("Solo se pueden cancelar reservas futuras.");
    }

    const penalty = getBookingPenaltyOutcome({
      policyHours: booking.cancellationPolicyHours ?? 24,
      startsAt: booking.startsAt,
    });
    const newStatus = actor.role === "member" ? "cancelled_by_user" : "cancelled_by_admin";
    const now = new Date();

    if (penalty.shouldRefund && booking.memberPlanId) {
      await lockMemberPlan(tx, booking.memberPlanId);
    }

    const [cancelledBooking] = await tx
      .update(bookings)
      .set({
        status: newStatus,
        cancellationReason: reason ?? null,
        cancelledAt: now,
        cancelledBy: actor.id,
        updatedAt: now,
      })
      .where(
        and(
          eq(bookings.id, booking.id),
          inArray(bookings.status, [...cancellableStatuses]),
        ),
      )
      .returning({ id: bookings.id });

    if (!cancelledBooking) {
      throw new Error("La reserva ya fue cancelada.");
    }

    const refundedQuota = penalty.shouldRefund && Boolean(booking.memberPlanId);

    if (refundedQuota && booking.memberPlanId) {
      const [refundedPlan] = await tx
        .update(memberPlans)
        .set({
          quotaRemaining: sql`${memberPlans.quotaRemaining} + ${booking.quotaConsumed}`,
          quotaUsed: sql`${memberPlans.quotaUsed} - ${booking.quotaConsumed}`,
          updatedBy: actor.id,
          updatedAt: now,
        })
        .where(
          and(
            eq(memberPlans.id, booking.memberPlanId),
            gte(memberPlans.quotaUsed, booking.quotaConsumed),
          ),
        )
        .returning({ id: memberPlans.id });

      if (!refundedPlan) {
        throw new Error("No pudimos reintegrar los cupos de la reserva.");
      }
    }

    await tx.insert(bookingStatusHistory).values({
      bookingId: booking.id,
      oldStatus: booking.status,
      newStatus,
      changedBy: actor.id,
      note: refundedQuota
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
        refundedQuota,
        quotaConsumed: booking.quotaConsumed,
      },
    });

    return {
      bookingId: booking.id,
      status: newStatus,
      refundedQuota,
    };
  });
}
