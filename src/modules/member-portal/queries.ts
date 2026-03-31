import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookings, memberPlans, members, plans, profiles, spaces } from "@/lib/db/schema";

const memberUpcomingStatuses = ["pending", "confirmed"] as const;

export type MemberPortalSnapshot = {
  memberName: string;
  activePlan: {
    planName: string;
    quotaRemaining: number;
    quotaTotal: number;
    quotaUsed: number;
    nextPaymentDueAt: Date;
    endsAt: Date;
    cancellationPolicyHours: number;
  } | null;
  upcomingBookingsCount: number;
  nextBooking: {
    startsAt: Date;
    spaceName: string;
  } | null;
};

export type MemberProfileSnapshot = {
  fullName: string;
  email: string;
  phone: string | null;
};

export async function getMemberPortalSnapshot(
  profileId: string,
): Promise<MemberPortalSnapshot | null> {
  const db = getDb();

  const [memberRecord] = await db
    .select({
      memberId: members.id,
      memberName: members.fullName,
      planName: plans.name,
      quotaRemaining: memberPlans.quotaRemaining,
      quotaTotal: memberPlans.quotaTotal,
      quotaUsed: memberPlans.quotaUsed,
      nextPaymentDueAt: memberPlans.nextPaymentDueAt,
      endsAt: memberPlans.endsAt,
      cancellationPolicyHours: plans.cancellationPolicyHours,
    })
    .from(members)
    .leftJoin(
      memberPlans,
      and(eq(memberPlans.memberId, members.id), eq(memberPlans.status, "active")),
    )
    .leftJoin(plans, eq(plans.id, memberPlans.planId))
    .where(eq(members.profileId, profileId))
    .limit(1);

  if (!memberRecord) {
    return null;
  }

  const upcomingBookings = await db
    .select({
      startsAt: bookings.startsAt,
      spaceName: spaces.name,
    })
    .from(bookings)
    .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
    .where(
      and(
        eq(bookings.memberId, memberRecord.memberId),
        gte(bookings.startsAt, new Date()),
        inArray(bookings.status, [...memberUpcomingStatuses]),
      ),
    )
    .orderBy(asc(bookings.startsAt));

  const [nextBooking] = upcomingBookings;

  return {
    memberName: memberRecord.memberName,
    activePlan: memberRecord.planName
      ? {
          planName: memberRecord.planName,
          quotaRemaining: memberRecord.quotaRemaining ?? 0,
          quotaTotal: memberRecord.quotaTotal ?? 0,
          quotaUsed: memberRecord.quotaUsed ?? 0,
          nextPaymentDueAt: memberRecord.nextPaymentDueAt ?? new Date(),
          endsAt: memberRecord.endsAt ?? new Date(),
          cancellationPolicyHours: memberRecord.cancellationPolicyHours ?? 24,
        }
      : null,
    upcomingBookingsCount: upcomingBookings.length,
    nextBooking: nextBooking
      ? {
          startsAt: nextBooking.startsAt,
          spaceName: nextBooking.spaceName,
        }
      : null,
  };
}

export async function getMemberProfileSnapshot(
  profileId: string,
): Promise<MemberProfileSnapshot | null> {
  const db = getDb();

  const [profileRecord] = await db
    .select({
      fullName: profiles.fullName,
      email: profiles.email,
      phone: profiles.phone,
    })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  return profileRecord ?? null;
}

export async function getMemberRecordByProfileId(profileId: string) {
  const db = getDb();

  const [memberRecord] = await db
    .select({
      id: members.id,
      fullName: members.fullName,
      phone: members.phone,
    })
    .from(members)
    .where(eq(members.profileId, profileId))
    .limit(1);

  return memberRecord ?? null;
}

export async function listMemberPlanBookings(profileId: string) {
  const db = getDb();
  const memberRecord = await getMemberRecordByProfileId(profileId);

  if (!memberRecord) {
    return [];
  }

  return db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      durationHours: bookings.durationHours,
      quotaConsumed: bookings.quotaConsumed,
      spaceName: spaces.name,
    })
    .from(bookings)
    .innerJoin(spaces, eq(spaces.id, bookings.spaceId))
    .where(eq(bookings.memberId, memberRecord.id))
    .orderBy(desc(bookings.startsAt))
    .limit(6);
}
