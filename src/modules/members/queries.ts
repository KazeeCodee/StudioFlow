import { and, count, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { bookings, memberPlans, members, plans, profiles, renewals } from "@/lib/db/schema";

export async function listMembers() {
  const db = getDb();

  return db
    .select({
      id: members.id,
      fullName: members.fullName,
      email: members.email,
      phone: members.phone,
      status: members.status,
      activePlanStatus: memberPlans.status,
      activePlanEndsAt: memberPlans.endsAt,
      quotaRemaining: memberPlans.quotaRemaining,
      planName: plans.name,
      createdAt: members.createdAt,
    })
    .from(members)
    .leftJoin(
      memberPlans,
      and(eq(memberPlans.memberId, members.id), eq(memberPlans.status, "active")),
    )
    .leftJoin(plans, eq(plans.id, memberPlans.planId))
    .orderBy(desc(members.createdAt));
}

export async function getMemberDetail(memberId: string) {
  const db = getDb();

  const [member] = await db
    .select({
      id: members.id,
      profileId: members.profileId,
      fullName: members.fullName,
      email: members.email,
      phone: members.phone,
      status: members.status,
      notes: members.notes,
      profileStatus: profiles.status,
      createdAt: members.createdAt,
      updatedAt: members.updatedAt,
    })
    .from(members)
    .leftJoin(profiles, eq(profiles.id, members.profileId))
    .where(eq(members.id, memberId))
    .limit(1);

  if (!member) {
    notFound();
  }

  const [activePlan] = await db
    .select({
      memberPlanId: memberPlans.id,
      planId: memberPlans.planId,
      planName: plans.name,
      status: memberPlans.status,
      startsAt: memberPlans.startsAt,
      endsAt: memberPlans.endsAt,
      nextPaymentDueAt: memberPlans.nextPaymentDueAt,
      quotaTotal: memberPlans.quotaTotal,
      quotaUsed: memberPlans.quotaUsed,
      quotaRemaining: memberPlans.quotaRemaining,
    })
    .from(memberPlans)
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .where(and(eq(memberPlans.memberId, member.id), eq(memberPlans.status, "active")))
    .orderBy(desc(memberPlans.createdAt))
    .limit(1);

  const planHistory = await db
    .select({
      id: memberPlans.id,
      planId: memberPlans.planId,
      planName: plans.name,
      status: memberPlans.status,
      startsAt: memberPlans.startsAt,
      endsAt: memberPlans.endsAt,
      quotaRemaining: memberPlans.quotaRemaining,
    })
    .from(memberPlans)
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .where(eq(memberPlans.memberId, member.id))
    .orderBy(desc(memberPlans.createdAt))
    .limit(6);

  const [[{ bookingCount }], [{ planCount }], [{ renewalCount }]] = await Promise.all([
    db
      .select({ bookingCount: count() })
      .from(bookings)
      .where(eq(bookings.memberId, member.id)),
    db
      .select({ planCount: count() })
      .from(memberPlans)
      .where(eq(memberPlans.memberId, member.id)),
    db
      .select({ renewalCount: count() })
      .from(renewals)
      .where(eq(renewals.memberId, member.id)),
  ]);

  return {
    id: member.id,
    profileId: member.profileId,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    status: member.profileStatus ?? member.status,
    notes: member.notes,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    deleteSummary: {
      canDelete: bookingCount === 0 && planCount === 0 && renewalCount === 0,
      bookingCount,
      planCount,
      renewalCount,
    },
    activePlan: activePlan ?? null,
    planHistory,
  };
}
