import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { memberPlans, members, plans } from "@/lib/db/schema";
import { getOperationalSettings } from "@/modules/settings/queries";

function addDays(baseDate: Date, days: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export async function listRenewalAlerts({
  renewalWindowDays,
  lowQuotaThreshold,
}: {
  renewalWindowDays?: number;
  lowQuotaThreshold?: number;
} = {}) {
  const db = getDb();
  const now = new Date();
  const settings = await getOperationalSettings();
  const effectiveRenewalWindowDays =
    renewalWindowDays ?? settings.renewalWindowDays;
  const effectiveLowQuotaThreshold =
    lowQuotaThreshold ?? settings.lowQuotaThreshold;
  const renewalWindowEnd = addDays(now, effectiveRenewalWindowDays);

  const [upcomingRenewals, lowQuotaPlans] = await Promise.all([
    db
      .select({
        memberPlanId: memberPlans.id,
        memberId: members.id,
        memberName: members.fullName,
        memberEmail: members.email,
        planName: plans.name,
        endsAt: memberPlans.endsAt,
        nextPaymentDueAt: memberPlans.nextPaymentDueAt,
        quotaRemaining: memberPlans.quotaRemaining,
      })
      .from(memberPlans)
      .innerJoin(members, eq(members.id, memberPlans.memberId))
      .innerJoin(plans, eq(plans.id, memberPlans.planId))
      .where(
        and(
          eq(memberPlans.status, "active"),
          gte(memberPlans.nextPaymentDueAt, now),
          lte(memberPlans.nextPaymentDueAt, renewalWindowEnd),
        ),
      )
      .orderBy(asc(memberPlans.nextPaymentDueAt)),
    db
      .select({
        memberPlanId: memberPlans.id,
        memberId: members.id,
        memberName: members.fullName,
        memberEmail: members.email,
        planName: plans.name,
        quotaRemaining: memberPlans.quotaRemaining,
        nextPaymentDueAt: memberPlans.nextPaymentDueAt,
      })
      .from(memberPlans)
      .innerJoin(members, eq(members.id, memberPlans.memberId))
      .innerJoin(plans, eq(plans.id, memberPlans.planId))
      .where(
        and(
          eq(memberPlans.status, "active"),
          lte(memberPlans.quotaRemaining, effectiveLowQuotaThreshold),
        ),
      )
      .orderBy(asc(memberPlans.quotaRemaining), asc(memberPlans.nextPaymentDueAt)),
  ]);

  return {
    upcomingRenewals,
    lowQuotaPlans,
  };
}

export async function listRecentRenewals() {
  const db = getDb();

  return db
    .select({
      id: memberPlans.id,
      memberName: members.fullName,
      planName: plans.name,
      quotaRemaining: memberPlans.quotaRemaining,
      nextPaymentDueAt: memberPlans.nextPaymentDueAt,
      lastRenewedAt: memberPlans.lastRenewedAt,
    })
    .from(memberPlans)
    .innerJoin(members, eq(members.id, memberPlans.memberId))
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .where(eq(memberPlans.status, "active"))
    .orderBy(desc(memberPlans.lastRenewedAt), asc(memberPlans.nextPaymentDueAt));
}
