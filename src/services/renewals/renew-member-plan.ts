import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditLogs,
  memberPlans,
  members,
  plans,
  renewals,
} from "@/lib/db/schema";
import type { AuthenticatedProfile } from "@/modules/auth/types";
import { calculateRenewalEndDate } from "@/modules/renewals/calendar";
import { RenewalConflictError } from "@/services/renewals/errors";

export type RenewMemberPlanInput = {
  memberPlanId: string;
  expectedNextPaymentDueAt: Date;
  amountReceived: number;
  currency: "ARS";
  paymentMethod: "bank_transfer" | "cash" | "card" | "other";
  paidAt: Date;
  externalReference?: string;
  notes?: string;
};

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

export { calculateRenewalEndDate } from "@/modules/renewals/calendar";

export async function renewMemberPlan(
  input: RenewMemberPlanInput,
  actor: AuthenticatedProfile,
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [currentPlan] = await tx
      .select({
        id: memberPlans.id,
        memberId: memberPlans.memberId,
        memberName: members.fullName,
        planId: memberPlans.planId,
        endsAt: memberPlans.endsAt,
        nextPaymentDueAt: memberPlans.nextPaymentDueAt,
        quotaRemaining: memberPlans.quotaRemaining,
        quotaTotal: memberPlans.quotaTotal,
        planDurationType: plans.durationType,
        planDurationValue: plans.durationValue,
        planQuotaAmount: plans.quotaAmount,
      })
      .from(memberPlans)
      .innerJoin(members, eq(members.id, memberPlans.memberId))
      .innerJoin(plans, eq(plans.id, memberPlans.planId))
      .where(
        and(
          eq(memberPlans.id, input.memberPlanId),
          eq(memberPlans.status, "active"),
        ),
      )
      .limit(1)
      .for("update", { of: memberPlans });

    if (!currentPlan) {
      throw new Error("No encontramos un plan activo para renovar.");
    }

    if (
      currentPlan.nextPaymentDueAt.getTime() !==
      input.expectedNextPaymentDueAt.getTime()
    ) {
      throw new RenewalConflictError();
    }

    const now = new Date();
    const anchorDate = currentPlan.endsAt > now ? currentPlan.endsAt : now;
    const newEndDate = calculateRenewalEndDate({
      anchorDate,
      durationType: currentPlan.planDurationType,
      durationValue: currentPlan.planDurationValue,
    });
    const snapshot = buildRenewalSnapshot({
      oldQuotaRemaining: currentPlan.quotaRemaining,
      newQuotaTotal: currentPlan.planQuotaAmount,
    });

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
        amountReceived: input.amountReceived.toFixed(2),
        currency: input.currency,
        paymentMethod: input.paymentMethod,
        paidAt: input.paidAt,
        externalReference: input.externalReference ?? null,
        notes: input.notes ?? null,
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
        oldEndDate: currentPlan.endsAt,
        newEndDate,
        quotaTotal: snapshot.quotaTotal,
        amountReceived: input.amountReceived,
        currency: input.currency,
        paymentMethod: input.paymentMethod,
        paidAt: input.paidAt,
        externalReference: input.externalReference ?? null,
      },
    });

    return {
      renewalId: renewal.id,
      memberName: currentPlan.memberName,
      newEndDate,
      quotaRemaining: snapshot.quotaRemaining,
    };
  });
}
