type QuotaAdjustmentSnapshotInput = {
  quotaTotal: number;
  quotaUsed: number;
  quotaRemaining: number;
  delta: number;
};

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs, memberPlans } from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";

export function buildQuotaAdjustmentSnapshot({
  quotaTotal,
  quotaUsed,
  quotaRemaining,
  delta,
}: QuotaAdjustmentSnapshotInput) {
  const nextQuotaTotal = quotaTotal + delta;
  const nextQuotaRemaining = quotaRemaining + delta;

  if (nextQuotaRemaining < 0) {
    throw new Error("Los cupos restantes no pueden quedar en negativo.");
  }

  if (nextQuotaTotal < quotaUsed) {
    throw new Error("El total de cupos no puede quedar por debajo de los usados.");
  }

  return {
    quotaTotal: nextQuotaTotal,
    quotaUsed,
    quotaRemaining: nextQuotaRemaining,
  };
}

export async function adjustMemberQuota(
  {
    memberId,
    delta,
    reason,
  }: {
    memberId: string;
    delta: number;
    reason: string;
  },
  actor: AuthenticatedProfile,
) {
  const db = getDb();

  const [activeMemberPlan] = await db
    .select({
      id: memberPlans.id,
      quotaTotal: memberPlans.quotaTotal,
      quotaUsed: memberPlans.quotaUsed,
      quotaRemaining: memberPlans.quotaRemaining,
    })
    .from(memberPlans)
    .where(and(eq(memberPlans.memberId, memberId), eq(memberPlans.status, "active")))
    .limit(1);

  if (!activeMemberPlan) {
    throw new Error("El miembro no tiene un plan activo para ajustar.");
  }

  const snapshot = buildQuotaAdjustmentSnapshot({
    quotaTotal: activeMemberPlan.quotaTotal,
    quotaUsed: activeMemberPlan.quotaUsed,
    quotaRemaining: activeMemberPlan.quotaRemaining,
    delta,
  });
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(memberPlans)
      .set({
        quotaTotal: snapshot.quotaTotal,
        quotaRemaining: snapshot.quotaRemaining,
        updatedBy: actor.id,
        updatedAt: now,
      })
      .where(eq(memberPlans.id, activeMemberPlan.id));

    await tx.insert(auditLogs).values({
      actorId: actor.id,
      actorRole: actor.role,
      action: "member_plan.quota_adjusted",
      entityType: "member_plan",
      entityId: activeMemberPlan.id,
      metadata: {
        memberId,
        delta,
        reason,
        previousQuotaTotal: activeMemberPlan.quotaTotal,
        previousQuotaRemaining: activeMemberPlan.quotaRemaining,
        quotaTotal: snapshot.quotaTotal,
        quotaRemaining: snapshot.quotaRemaining,
      },
    });
  });

  return {
    memberPlanId: activeMemberPlan.id,
    quotaTotal: snapshot.quotaTotal,
    quotaRemaining: snapshot.quotaRemaining,
  };
}
