import { count, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { memberPlans, plans } from "@/lib/db/schema";

export async function listPlans() {
  const db = getDb();

  return db
    .select({
      id: plans.id,
      name: plans.name,
      description: plans.description,
      status: plans.status,
      durationType: plans.durationType,
      durationValue: plans.durationValue,
      quotaAmount: plans.quotaAmount,
      price: plans.price,
      cancellationPolicyHours: plans.cancellationPolicyHours,
      createdAt: plans.createdAt,
    })
    .from(plans)
    .orderBy(desc(plans.createdAt));
}

export async function listActivePlanOptions() {
  const items = await listPlans();

  return items
    .filter((plan) => plan.status === "active" || plan.status === "draft")
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      quotaAmount: plan.quotaAmount,
      durationType: plan.durationType,
      durationValue: plan.durationValue,
    }));
}

export async function getPlanDetail(planId: string) {
  const db = getDb();

  const [plan] = await db
    .select({
      id: plans.id,
      name: plans.name,
      description: plans.description,
      status: plans.status,
      durationType: plans.durationType,
      durationValue: plans.durationValue,
      quotaAmount: plans.quotaAmount,
      price: plans.price,
      cancellationPolicyHours: plans.cancellationPolicyHours,
      maxBookingsPerDay: plans.maxBookingsPerDay,
      maxBookingsPerWeek: plans.maxBookingsPerWeek,
      createdAt: plans.createdAt,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!plan) {
    notFound();
  }

  const [{ memberPlanCount }] = await db
    .select({ memberPlanCount: count() })
    .from(memberPlans)
    .where(eq(memberPlans.planId, plan.id));

  return {
    ...plan,
    deleteSummary: {
      canDelete: memberPlanCount === 0,
      memberPlanCount,
    },
  };
}
