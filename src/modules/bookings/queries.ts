import { and, desc, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatStudioDateTime } from "@/lib/datetime";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  bookingStatusHistory,
  bookings,
  memberPlans,
  members,
  plans,
  profiles,
  spaceAvailabilityRules,
  spaceBlocks,
  spaces,
} from "@/lib/db/schema";

const activeBookingStatuses = ["pending", "confirmed"] as const;

function formatStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Reserva pendiente";
    case "confirmed":
      return "Reserva confirmada";
    case "cancelled_by_user":
      return "Reserva cancelada por el miembro";
    case "cancelled_by_admin":
      return "Reserva cancelada por staff";
    case "completed":
      return "Reserva completada";
    case "no_show":
      return "Reserva marcada como no show";
    default:
      return `Estado ${status}`;
  }
}

function formatAuditLabel(action: string) {
  switch (action) {
    case "booking.created":
      return "Reserva creada";
    case "booking.cancelled":
      return "Reserva cancelada";
    case "booking.rescheduled":
      return "Reserva reprogramada";
    default:
      return action;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function buildAuditDescription(action: string, metadata: unknown) {
  if (!isRecord(metadata)) {
    return null;
  }

  if (action === "booking.rescheduled") {
    const previousStartsAt = asDate(metadata.previousStartsAt);
    const nextStartsAt = asDate(metadata.nextStartsAt);
    const refundedQuota = metadata.refundedQuota === true;

    if (previousStartsAt && nextStartsAt) {
      return `${formatStudioDateTime(previousStartsAt)} -> ${formatStudioDateTime(nextStartsAt)}${refundedQuota ? " con reintegro previo." : " sin reintegro por politica."}`;
    }
  }

  if (action === "booking.cancelled") {
    if (metadata.refundedQuota === true) {
      return "La cancelacion devolvio los cupos consumidos segun la politica del plan.";
    }

    if (metadata.refundedQuota === false) {
      return "La cancelacion mantuvo los cupos consumidos por estar fuera de politica.";
    }
  }

  if (action === "booking.created" && typeof metadata.quotaConsumed === "number") {
    return `La reserva consumio ${metadata.quotaConsumed} cupo(s).`;
  }

  if (typeof metadata.reason === "string" && metadata.reason.trim().length > 0) {
    return metadata.reason;
  }

  return null;
}

export async function listBookingSpaceOptions() {
  const db = getDb();

  return db
    .select({
      id: spaces.id,
      name: spaces.name,
      hourlyQuotaCost: spaces.hourlyQuotaCost,
    })
    .from(spaces)
    .where(eq(spaces.status, "active"))
    .orderBy(spaces.name);
}

export async function listSmartBookingSpaceOptions() {
  const db = getDb();

  const spacesList = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      hourlyQuotaCost: spaces.hourlyQuotaCost,
      minBookingHours: spaces.minBookingHours,
      maxBookingHours: spaces.maxBookingHours,
      imageUrl: spaces.imageUrl,
    })
    .from(spaces)
    .where(eq(spaces.status, "active"))
    .orderBy(spaces.name);

  const rules = await db.select().from(spaceAvailabilityRules);

  return spacesList.map((space) => ({
    ...space,
    availabilityRules: rules.filter((r) => r.spaceId === space.id),
  }));
}

export async function listBookingMemberOptions() {
  const db = getDb();

  return db
    .select({
      id: members.id,
      fullName: members.fullName,
      email: members.email,
      quotaRemaining: memberPlans.quotaRemaining,
      planName: plans.name,
    })
    .from(members)
    .innerJoin(
      memberPlans,
      and(eq(memberPlans.memberId, members.id), eq(memberPlans.status, "active")),
    )
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .orderBy(members.fullName);
}

export async function getMemberByProfileId(profileId: string) {
  const db = getDb();

  const [member] = await db
    .select({
      id: members.id,
      fullName: members.fullName,
      email: members.email,
      status: members.status,
      profileId: members.profileId,
    })
    .from(members)
    .where(eq(members.profileId, profileId))
    .limit(1);

  return member ?? null;
}

export async function getActiveMemberPlan(memberId: string) {
  const db = getDb();

  const [memberPlan] = await db
    .select({
      id: memberPlans.id,
      memberId: memberPlans.memberId,
      status: memberPlans.status,
      startsAt: memberPlans.startsAt,
      endsAt: memberPlans.endsAt,
      quotaTotal: memberPlans.quotaTotal,
      quotaUsed: memberPlans.quotaUsed,
      quotaRemaining: memberPlans.quotaRemaining,
      cancellationPolicyHours: plans.cancellationPolicyHours,
      planName: plans.name,
    })
    .from(memberPlans)
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .where(and(eq(memberPlans.memberId, memberId), eq(memberPlans.status, "active")))
    .limit(1);

  return memberPlan ?? null;
}

export async function getSpaceBookingContext(spaceId: string) {
  const db = getDb();

  const [space] = await db
    .select({
      id: spaces.id,
      name: spaces.name,
      status: spaces.status,
      description: spaces.description,
      imageUrl: spaces.imageUrl,
      galleryUrls: spaces.galleryUrls,
      videoLinks: spaces.videoLinks,
      hourlyQuotaCost: spaces.hourlyQuotaCost,
      minBookingHours: spaces.minBookingHours,
      maxBookingHours: spaces.maxBookingHours,
    })
    .from(spaces)
    .where(eq(spaces.id, spaceId))
    .limit(1);

  if (!space) {
    return null;
  }

  const availabilityRules = await db
    .select({
      id: spaceAvailabilityRules.id,
      dayOfWeek: spaceAvailabilityRules.dayOfWeek,
      startTime: spaceAvailabilityRules.startTime,
      endTime: spaceAvailabilityRules.endTime,
      isActive: spaceAvailabilityRules.isActive,
    })
    .from(spaceAvailabilityRules)
    .where(eq(spaceAvailabilityRules.spaceId, space.id));

  return {
    ...space,
    availabilityRules,
  };
}

export async function getOverlappingSpaceBlocks(spaceId: string, startsAt: Date, endsAt: Date) {
  const db = getDb();

  return db
    .select({
      id: spaceBlocks.id,
      startsAt: spaceBlocks.startsAt,
      endsAt: spaceBlocks.endsAt,
      title: spaceBlocks.title,
    })
    .from(spaceBlocks)
    .where(
      and(
        eq(spaceBlocks.spaceId, spaceId),
        lt(spaceBlocks.startsAt, endsAt),
        gt(spaceBlocks.endsAt, startsAt),
      ),
    );
}

export async function getOverlappingBookings(spaceId: string, startsAt: Date, endsAt: Date) {
  const db = getDb();

  return db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.spaceId, spaceId),
        inArray(bookings.status, [...activeBookingStatuses]),
        lt(bookings.startsAt, endsAt),
        gt(bookings.endsAt, startsAt),
      ),
    );
}

export async function getOverlappingBookingsExcludingCurrent({
  endsAt,
  spaceId,
  startsAt,
  bookingId,
}: {
  bookingId: string;
  spaceId: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const db = getDb();

  return db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.spaceId, spaceId),
        inArray(bookings.status, [...activeBookingStatuses]),
        lt(bookings.startsAt, endsAt),
        gt(bookings.endsAt, startsAt),
        ne(bookings.id, bookingId),
      ),
    );
}

export async function listAdminBookings() {
  const db = getDb();

  return db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      quotaConsumed: bookings.quotaConsumed,
      memberName: members.fullName,
      spaceName: spaces.name,
      memberId: members.id,
    })
    .from(bookings)
    .innerJoin(members, eq(members.id, bookings.memberId))
    .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
    .orderBy(desc(bookings.startsAt));
}

export async function listCalendarEntries({
  memberId,
  spaceId,
  status,
}: {
  memberId?: string;
  spaceId?: string;
  status?: string;
} = {}) {
  const db = getDb();
  const bookingConditions = [
    memberId ? eq(bookings.memberId, memberId) : undefined,
    spaceId ? eq(bookings.spaceId, spaceId) : undefined,
    status ? eq(bookings.status, status as "pending") : undefined,
  ].filter(Boolean);

  const blockConditions = [spaceId ? eq(spaceBlocks.spaceId, spaceId) : undefined].filter(Boolean);

  const [bookingItems, blockItems] = await Promise.all([
    db
      .select({
        id: bookings.id,
        title: spaces.name,
        start: bookings.startsAt,
        end: bookings.endsAt,
        status: bookings.status,
        memberName: members.fullName,
        resourceLabel: spaces.name,
      })
      .from(bookings)
      .innerJoin(members, eq(members.id, bookings.memberId))
      .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
      .where(bookingConditions.length > 0 ? and(...bookingConditions) : undefined)
      .orderBy(bookings.startsAt),
    db
      .select({
        id: spaceBlocks.id,
        title: spaceBlocks.title,
        start: spaceBlocks.startsAt,
        end: spaceBlocks.endsAt,
        reason: spaceBlocks.reason,
        resourceLabel: spaces.name,
      })
      .from(spaceBlocks)
      .innerJoin(spaces, eq(spaces.id, spaceBlocks.spaceId))
      .where(blockConditions.length > 0 ? and(...blockConditions) : undefined)
      .orderBy(spaceBlocks.startsAt),
  ]);

  return [
    ...bookingItems.map((item) => ({
      id: item.id,
      title: item.title,
      start: item.start.toISOString(),
      end: item.end.toISOString(),
      extendedProps: {
        type: "booking" as const,
        status: item.status,
        resourceLabel: item.resourceLabel,
        secondaryLabel: item.memberName,
      },
    })),
    ...blockItems.map((item) => ({
      id: item.id,
      title: item.title,
      start: item.start.toISOString(),
      end: item.end.toISOString(),
      extendedProps: {
        type: "block" as const,
        resourceLabel: item.resourceLabel,
        secondaryLabel: item.reason ?? "Bloqueo operativo",
      },
    })),
  ].sort((a, b) => a.start.localeCompare(b.start));
}

export async function listMemberBookings(profileId: string) {
  const member = await getMemberByProfileId(profileId);

  if (!member) {
    return [];
  }

  const db = getDb();
  return db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      quotaConsumed: bookings.quotaConsumed,
      spaceName: spaces.name,
    })
    .from(bookings)
    .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
    .where(eq(bookings.memberId, member.id))
    .orderBy(desc(bookings.startsAt));
}

export async function getBookingForCancellation(bookingId: string) {
  const db = getDb();

  const [booking] = await db
    .select({
      id: bookings.id,
      memberId: bookings.memberId,
      memberPlanId: bookings.memberPlanId,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      quotaConsumed: bookings.quotaConsumed,
      cancellationReason: bookings.cancellationReason,
      memberProfileId: members.profileId,
      cancellationPolicyHours: plans.cancellationPolicyHours,
      memberPlanQuotaRemaining: memberPlans.quotaRemaining,
      memberPlanQuotaUsed: memberPlans.quotaUsed,
    })
    .from(bookings)
    .innerJoin(members, eq(members.id, bookings.memberId))
    .leftJoin(memberPlans, eq(memberPlans.id, bookings.memberPlanId))
    .leftJoin(plans, eq(plans.id, memberPlans.planId))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking ?? null;
}

export async function getBookingForReschedule(bookingId: string) {
  const db = getDb();

  const [booking] = await db
    .select({
      id: bookings.id,
      memberId: bookings.memberId,
      memberPlanId: bookings.memberPlanId,
      memberProfileId: members.profileId,
      spaceId: bookings.spaceId,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      durationHours: bookings.durationHours,
      status: bookings.status,
      quotaConsumed: bookings.quotaConsumed,
      memberPlanQuotaRemaining: memberPlans.quotaRemaining,
      memberPlanQuotaUsed: memberPlans.quotaUsed,
      cancellationPolicyHours: plans.cancellationPolicyHours,
    })
    .from(bookings)
    .innerJoin(members, eq(members.id, bookings.memberId))
    .leftJoin(memberPlans, eq(memberPlans.id, bookings.memberPlanId))
    .leftJoin(plans, eq(plans.id, memberPlans.planId))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking ?? null;
}

export async function getBookingDetail(bookingId: string) {
  const db = getDb();

  const [booking] = await db
    .select({
      id: bookings.id,
      memberId: bookings.memberId,
      memberProfileId: members.profileId,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      durationHours: bookings.durationHours,
      quotaConsumed: bookings.quotaConsumed,
      cancellationReason: bookings.cancellationReason,
      cancelledAt: bookings.cancelledAt,
      memberName: members.fullName,
      memberEmail: members.email,
      spaceName: spaces.name,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      cancellationPolicyHours: plans.cancellationPolicyHours,
    })
    .from(bookings)
    .innerJoin(members, eq(members.id, bookings.memberId))
    .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
    .leftJoin(memberPlans, eq(memberPlans.id, bookings.memberPlanId))
    .leftJoin(plans, eq(plans.id, memberPlans.planId))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    notFound();
  }

  const [statusEntries, auditEntries] = await Promise.all([
    db
      .select({
        id: bookingStatusHistory.id,
        createdAt: bookingStatusHistory.changedAt,
        actorName: profiles.fullName,
        oldStatus: bookingStatusHistory.oldStatus,
        newStatus: bookingStatusHistory.newStatus,
        note: bookingStatusHistory.note,
      })
      .from(bookingStatusHistory)
      .leftJoin(profiles, eq(profiles.id, bookingStatusHistory.changedBy))
      .where(eq(bookingStatusHistory.bookingId, booking.id))
      .orderBy(desc(bookingStatusHistory.changedAt)),
    db
      .select({
        id: auditLogs.id,
        createdAt: auditLogs.createdAt,
        actorName: profiles.fullName,
        action: auditLogs.action,
        metadata: auditLogs.metadata,
      })
      .from(auditLogs)
      .leftJoin(profiles, eq(profiles.id, auditLogs.actorId))
      .where(and(eq(auditLogs.entityType, "booking"), eq(auditLogs.entityId, booking.id)))
      .orderBy(desc(auditLogs.createdAt)),
  ]);

  const timeline = [
    ...statusEntries.map((entry) => ({
      id: entry.id,
      kind: "status" as const,
      createdAt: entry.createdAt,
      actorName: entry.actorName,
      label: entry.note?.trim() || formatStatusLabel(entry.newStatus),
      description:
        entry.oldStatus && entry.oldStatus !== entry.newStatus
          ? `${formatStatusLabel(entry.oldStatus)} -> ${formatStatusLabel(entry.newStatus)}`
          : null,
    })),
    ...auditEntries.map((entry) => ({
      id: entry.id,
      kind: "audit" as const,
      createdAt: entry.createdAt,
      actorName: entry.actorName,
      label: formatAuditLabel(entry.action),
      description: buildAuditDescription(entry.action, entry.metadata),
    })),
  ].sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());

  return {
    ...booking,
    timeline,
  };
}
