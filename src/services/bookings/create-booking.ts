import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
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
import { calculateBookingQuota } from "@/services/bookings/calculate-booking-quota";
import { hasOverlap } from "@/services/bookings/check-availability";

function parseLocalDateTime(value: string) {
  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) {
    throw new Error("Fecha inválida.");
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) {
    throw new Error("Fecha inválida.");
  }

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function validateBookingWindow(startsAtInput: string, endsAtInput: string) {
  const startsAt = parseLocalDateTime(startsAtInput);
  const endsAt = parseLocalDateTime(endsAtInput);

  if (endsAt <= startsAt) {
    throw new Error("El fin debe ser posterior al inicio.");
  }

  if (
    startsAt.getUTCMinutes() !== 0 ||
    endsAt.getUTCMinutes() !== 0 ||
    startsAt.getUTCSeconds() !== 0 ||
    endsAt.getUTCSeconds() !== 0
  ) {
    throw new Error("Las reservas deben comenzar y terminar en horas enteras.");
  }

  if (
    startsAt.getUTCFullYear() !== endsAt.getUTCFullYear() ||
    startsAt.getUTCMonth() !== endsAt.getUTCMonth() ||
    startsAt.getUTCDate() !== endsAt.getUTCDate()
  ) {
    throw new Error("La reserva debe quedar dentro del mismo día.");
  }

  const durationHours = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;

  if (!Number.isInteger(durationHours) || durationHours <= 0) {
    throw new Error("La reserva debe durar una cantidad entera de horas.");
  }

  return {
    startsAt,
    endsAt,
    durationHours,
  };
}

function assertWithinAvailability({
  startsAt,
  endsAt,
  availabilityRules,
}: {
  startsAt: Date;
  endsAt: Date;
  availabilityRules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }[];
}) {
  const dayOfWeek = startsAt.getUTCDay();
  const rule = availabilityRules.find((item) => item.dayOfWeek === dayOfWeek && item.isActive);

  if (!rule) {
    throw new Error("El espacio no opera en el día seleccionado.");
  }

  const bookingStart = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
  const bookingEnd = endsAt.getUTCHours() * 60 + endsAt.getUTCMinutes();
  const ruleStart = parseTimeToMinutes(rule.startTime);
  const ruleEnd = parseTimeToMinutes(rule.endTime);

  if (bookingStart < ruleStart || bookingEnd > ruleEnd) {
    throw new Error("La reserva queda fuera del horario disponible del espacio.");
  }
}

export async function createBooking(
  input: BookingInput,
  actor: AuthenticatedProfile,
) {
  const targetMemberId =
    actor.role === "member"
      ? (await getMemberByProfileId(actor.id))?.id
      : input.memberId;

  if (!targetMemberId) {
    throw new Error("No encontramos el miembro para esta reserva.");
  }

  const { startsAt, endsAt, durationHours } = validateBookingWindow(
    input.startsAt,
    input.endsAt,
  );
  const [memberPlan, space] = await Promise.all([
    getActiveMemberPlan(targetMemberId),
    getSpaceBookingContext(input.spaceId),
  ]);

  if (!memberPlan) {
    throw new Error("El miembro no tiene un plan activo para reservar.");
  }

  if (!space) {
    throw new Error("El espacio seleccionado no existe.");
  }

  if (space.status !== "active") {
    throw new Error("El espacio no está disponible para reservas.");
  }

  if (memberPlan.endsAt < startsAt) {
    throw new Error("El plan del miembro está vencido.");
  }

  if (durationHours < space.minBookingHours || durationHours > space.maxBookingHours) {
    throw new Error("La duración no respeta los límites del espacio.");
  }

  assertWithinAvailability({
    startsAt,
    endsAt,
    availabilityRules: space.availabilityRules,
  });

  const [blockingBlocks, conflictingBookings] = await Promise.all([
    getOverlappingSpaceBlocks(space.id, startsAt, endsAt),
    getOverlappingBookings(space.id, startsAt, endsAt),
  ]);

  if (blockingBlocks.length > 0) {
    throw new Error("Existe un bloqueo operativo en ese horario.");
  }

  if (hasOverlap({ startsAt, endsAt }, conflictingBookings)) {
    throw new Error("El espacio ya tiene una reserva superpuesta.");
  }

  const quotaConsumed = calculateBookingQuota({
    durationHours,
    hourlyQuotaCost: space.hourlyQuotaCost,
  });

  if (memberPlan.quotaRemaining < quotaConsumed) {
    throw new Error("El miembro no tiene cupos suficientes.");
  }

  const db = getDb();

  return db.transaction(async (tx) => {
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

    await tx
      .update(memberPlans)
      .set({
        quotaUsed: memberPlan.quotaUsed + quotaConsumed,
        quotaRemaining: memberPlan.quotaRemaining - quotaConsumed,
        updatedBy: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(memberPlans.id, memberPlan.id));

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
      },
    });

    return booking;
  });
}
