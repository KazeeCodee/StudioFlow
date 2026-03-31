import { and, desc, eq, gt, inArray, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  bookings,
  memberPlans,
  members,
  plans,
  spaceAvailabilityRules,
  spaceBlocks,
  spaces,
} from "@/lib/db/schema";

const activeBookingStatuses = ["pending", "confirmed"] as const;

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
