type PlanDurationType = "weekly" | "monthly" | "custom";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { auditLogs, memberPlans, members, plans } from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";

type ChangedPlanSnapshotInput = {
  startsAt: Date;
  durationType: PlanDurationType;
  durationValue: number;
  quotaAmount: number;
};

function addPlanDuration({
  anchorDate,
  durationType,
  durationValue,
}: {
  anchorDate: Date;
  durationType: PlanDurationType;
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

export function buildChangedPlanSnapshot({
  startsAt,
  durationType,
  durationValue,
  quotaAmount,
}: ChangedPlanSnapshotInput) {
  const endsAt = addPlanDuration({
    anchorDate: startsAt,
    durationType,
    durationValue,
  });

  return {
    startsAt,
    endsAt,
    nextPaymentDueAt: endsAt,
    quotaTotal: quotaAmount,
    quotaRemaining: quotaAmount,
    quotaUsed: 0,
  };
}

export async function changeMemberPlan(
  {
    memberId,
    planId,
    reason,
  }: {
    memberId: string;
    planId: string;
    reason?: string;
  },
  actor: AuthenticatedProfile,
) {
  const db = getDb();

  const [member] = await db
    .select({
      id: members.id,
    })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!member) {
    throw new Error("No encontramos el miembro solicitado.");
  }

  const [targetPlan] = await db
    .select({
      id: plans.id,
      name: plans.name,
      status: plans.status,
      durationType: plans.durationType,
      durationValue: plans.durationValue,
      quotaAmount: plans.quotaAmount,
    })
    .from(plans)
    .where(and(eq(plans.id, planId), inArray(plans.status, ["active", "draft"])))
    .limit(1);

  if (!targetPlan) {
    throw new Error("El plan seleccionado no está disponible.");
  }

  const [currentActivePlan] = await db
    .select({
      id: memberPlans.id,
      planId: memberPlans.planId,
    })
    .from(memberPlans)
    .where(and(eq(memberPlans.memberId, memberId), eq(memberPlans.status, "active")))
    .limit(1);

  if (currentActivePlan?.planId === targetPlan.id) {
    throw new Error("El miembro ya tiene asignado ese plan.");
  }

  const startsAt = new Date();
  const snapshot = buildChangedPlanSnapshot({
    startsAt,
    durationType: targetPlan.durationType,
    durationValue: targetPlan.durationValue,
    quotaAmount: targetPlan.quotaAmount,
  });
  const now = new Date();

  return db.transaction(async (tx) => {
    if (currentActivePlan) {
      await tx
        .update(memberPlans)
        .set({
          status: "cancelled",
          updatedBy: actor.id,
          updatedAt: now,
        })
        .where(eq(memberPlans.id, currentActivePlan.id));
    }

    const [newMemberPlan] = await tx
      .insert(memberPlans)
      .values({
        memberId,
        planId: targetPlan.id,
        status: "active",
        startsAt: snapshot.startsAt,
        endsAt: snapshot.endsAt,
        nextPaymentDueAt: snapshot.nextPaymentDueAt,
        quotaTotal: snapshot.quotaTotal,
        quotaUsed: snapshot.quotaUsed,
        quotaRemaining: snapshot.quotaRemaining,
        createdBy: actor.id,
        updatedBy: actor.id,
      })
      .returning({
        id: memberPlans.id,
      });

    await tx.insert(auditLogs).values({
      actorId: actor.id,
      actorRole: actor.role,
      action: "member_plan.changed",
      entityType: "member_plan",
      entityId: newMemberPlan.id,
      metadata: {
        memberId,
        previousMemberPlanId: currentActivePlan?.id ?? null,
        planId: targetPlan.id,
        planName: targetPlan.name,
        reason: reason ?? null,
      },
    });

    return {
      memberPlanId: newMemberPlan.id,
      planId: targetPlan.id,
    };
  });
}
