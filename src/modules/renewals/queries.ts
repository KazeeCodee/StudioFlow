import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { memberPlans, members, plans } from "@/lib/db/schema";

export async function listRenewalCandidates() {
  const db = getDb();

  return db
    .select({
      memberPlanId: memberPlans.id,
      memberId: members.id,
      memberName: members.fullName,
      memberEmail: members.email,
      planName: plans.name,
      endsAt: memberPlans.endsAt,
      nextPaymentDueAt: memberPlans.nextPaymentDueAt,
      quotaRemaining: memberPlans.quotaRemaining,
      quotaTotal: memberPlans.quotaTotal,
      lastRenewedAt: memberPlans.lastRenewedAt,
    })
    .from(memberPlans)
    .innerJoin(members, eq(members.id, memberPlans.memberId))
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .where(eq(memberPlans.status, "active"))
    .orderBy(asc(memberPlans.nextPaymentDueAt));
}
