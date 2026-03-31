import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs, memberPlans, plans, renewals } from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";

export function buildRenewalSnapshot({
  oldQuotaRemaining,
  newQuotaTotal,
}: {
  oldQuotaRemaining: number;
  newQuotaTotal: number;
}) {
  return {
    oldQuotaRemaining,
    quotaRemaining: newQuotaTotal,
    quotaUsed: 0,
    quotaTotal: newQuotaTotal,
  };
}

function addPlanDuration({
  anchorDate,
  durationType,
  durationValue,
}: {
  anchorDate: Date;
  durationType: "weekly" | "monthly" | "custom";
  durationValue: number;
}) {
  const nextDate = new Date(anchorDate);

  switch (durationType) {
    case "weekly":
      nextDate.setDate(nextDate.getDate() + durationValue * 7);
      return nextDate;
    case "custom":
      nextDate.setDate(nextDate.getDate() + durationValue);
      return nextDate;
    case "monthly":
    default:
      nextDate.setMonth(nextDate.getMonth() + durationValue);
      return nextDate;
  }
}

export async function renewMemberPlan(
  {
    memberPlanId,
    notes,
  }: {
    memberPlanId: string;
    notes?: string;
  },
  actor: AuthenticatedProfile,
) {
  const db = getDb();

  const [currentPlan] = await db
    .select({
      id: memberPlans.id,
      memberId: memberPlans.memberId,
      planId: memberPlans.planId,
      endsAt: memberPlans.endsAt,
      quotaRemaining: memberPlans.quotaRemaining,
      quotaTotal: memberPlans.quotaTotal,
      planDurationType: plans.durationType,
      planDurationValue: plans.durationValue,
      planQuotaAmount: plans.quotaAmount,
    })
    .from(memberPlans)
    .innerJoin(plans, eq(plans.id, memberPlans.planId))
    .where(and(eq(memberPlans.id, memberPlanId), eq(memberPlans.status, "active")))
    .limit(1);

  if (!currentPlan) {
    throw new Error("No encontramos un plan activo para renovar.");
  }

  const now = new Date();
  const anchorDate = currentPlan.endsAt > now ? currentPlan.endsAt : now;
  const newEndDate = addPlanDuration({
    anchorDate,
    durationType: currentPlan.planDurationType,
    durationValue: currentPlan.planDurationValue,
  });
  const snapshot = buildRenewalSnapshot({
    oldQuotaRemaining: currentPlan.quotaRemaining,
    newQuotaTotal: currentPlan.planQuotaAmount,
  });

  return db.transaction(async (tx) => {
    await tx
      .update(memberPlans)
      .set({
        endsAt: newEndDate,
        nextPaymentDueAt: newEndDate,
        quotaTotal: snapshot.quotaTotal,
        quotaRemaining: snapshot.quotaRemaining,
        quotaUsed: snapshot.quotaUsed,
        lastRenewedAt: now,
        renewedManually: true,
        updatedBy: actor.id,
        updatedAt: now,
      })
      .where(eq(memberPlans.id, currentPlan.id));

    const [renewal] = await tx
      .insert(renewals)
      .values({
        memberId: currentPlan.memberId,
        memberPlanId: currentPlan.id,
        renewedBy: actor.id,
        renewedAt: now,
        oldEndDate: currentPlan.endsAt,
        newEndDate,
        oldQuotaRemaining: snapshot.oldQuotaRemaining,
        newQuotaTotal: snapshot.quotaTotal,
        notes: notes ?? null,
      })
      .returning({ id: renewals.id });

    await tx.insert(auditLogs).values({
      actorId: actor.id,
      actorRole: actor.role,
      action: "member_plan.renewed",
      entityType: "member_plan",
      entityId: currentPlan.id,
      metadata: {
        renewalId: renewal.id,
        newEndDate,
        quotaTotal: snapshot.quotaTotal,
      },
    });

    return {
      renewalId: renewal.id,
      newEndDate,
      quotaRemaining: snapshot.quotaRemaining,
    };
  });
}
