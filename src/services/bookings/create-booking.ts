import { and, eq, gte, sql } from "drizzle-orm";
import { auditLogs, bookingStatusHistory, bookings, memberPlans } from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";
import type { BookingInput } from "@/modules/bookings/schema";
import {
  getActiveMemberPlan,
  getMemberByProfileId,
  getOverlappingBookings,
  getOverlappingSpaceBlocks,
  getSpaceBookingContext,
} from "@/modules/bookings/queries";
import { getOperationalSettings } from "@/modules/settings/queries";
import { calculateBookingQuota } from "@/services/bookings/calculate-booking-quota";
import { applyBookingBuffer, hasOverlap } from "@/services/bookings/check-availability";
import { assertWithinAvailability, validateBookingWindow } from "@/services/bookings/booking-validation";
import {
  lockActiveMemberPlan,
  mapBookingTransactionError,
  runBookingTransaction,
} from "@/services/bookings/booking-transaction";

export async function createBooking(input: BookingInput, actor: AuthenticatedProfile) {
  const { startsAt, endsAt, durationHours } = validateBookingWindow(
    input.startsAt,
    input.endsAt,
  );

  try {
    return await runBookingTransaction(input.spaceId, async (tx) => {
      const targetMemberId =
        actor.role === "member"
          ? (await getMemberByProfileId(actor.id, tx))?.id
          : input.memberId;

      if (!targetMemberId) {
        throw new Error("No encontramos el miembro para esta reserva.");
      }

      await lockActiveMemberPlan(tx, targetMemberId);

      const [memberPlan, space, settings] = await Promise.all([
        getActiveMemberPlan(targetMemberId, tx),
        getSpaceBookingContext(input.spaceId, tx),
        getOperationalSettings(tx),
      ]);

      if (!memberPlan) {
        throw new Error("El miembro no tiene un plan activo para reservar.");
      }

      if (!space) {
        throw new Error("El espacio seleccionado no existe.");
      }

      if (space.status !== "active") {
        throw new Error("El espacio no esta disponible para reservas.");
      }

      if (memberPlan.endsAt < startsAt) {
        throw new Error("El plan del miembro esta vencido.");
      }

      if (durationHours < space.minBookingHours || durationHours > space.maxBookingHours) {
        throw new Error("La duracion no respeta los limites del espacio.");
      }

      assertWithinAvailability({
        startsAt,
        endsAt,
        availabilityRules: space.availabilityRules,
      });

      const bufferedInterval = applyBookingBuffer(
        { startsAt, endsAt },
        settings.bookingBufferHours,
      );

      const [blockingBlocks, conflictingBookings] = await Promise.all([
        getOverlappingSpaceBlocks(space.id, startsAt, endsAt, tx),
        getOverlappingBookings(
          space.id,
          bufferedInterval.startsAt,
          bufferedInterval.endsAt,
          tx,
        ),
      ]);

      if (blockingBlocks.length > 0) {
        throw new Error("Existe un bloqueo operativo en ese horario.");
      }

      if (hasOverlap(bufferedInterval, conflictingBookings)) {
        throw new Error("El espacio ya tiene una reserva superpuesta.");
      }

      const quotaConsumed = calculateBookingQuota({
        durationHours,
        hourlyQuotaCost: space.hourlyQuotaCost,
      });

      if (memberPlan.quotaRemaining < quotaConsumed) {
        throw new Error("El miembro no tiene cupos suficientes.");
      }

      const [updatedPlan] = await tx
        .update(memberPlans)
        .set({
          quotaUsed: sql`${memberPlans.quotaUsed} + ${quotaConsumed}`,
          quotaRemaining: sql`${memberPlans.quotaRemaining} - ${quotaConsumed}`,
          updatedBy: actor.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(memberPlans.id, memberPlan.id),
            gte(memberPlans.quotaRemaining, quotaConsumed),
          ),
        )
        .returning({ id: memberPlans.id });

      if (!updatedPlan) {
        throw new Error("El miembro no tiene cupos suficientes.");
      }

      const [booking] = await tx
        .insert(bookings)
        .values({
          memberId: targetMemberId,
          spaceId: space.id,
          memberPlanId: memberPlan.id,
          startsAt,
          endsAt,
          durationHours,
          hourlyQuotaCost: space.hourlyQuotaCost,
          quotaConsumed,
          status: "confirmed",
          createdBy: actor.id,
        })
        .returning({
          id: bookings.id,
        });

      await tx.insert(bookingStatusHistory).values({
        bookingId: booking.id,
        newStatus: "confirmed",
        changedBy: actor.id,
        note: "Reserva creada",
      });

      await tx.insert(auditLogs).values({
        actorId: actor.id,
        actorRole: actor.role,
        action: "booking.created",
        entityType: "booking",
        entityId: booking.id,
        metadata: {
          memberId: targetMemberId,
          spaceId: space.id,
          quotaConsumed,
          bookingBufferHours: settings.bookingBufferHours,
        },
      });

      return booking;
    });
  } catch (error) {
    throw mapBookingTransactionError(error);
  }
}
