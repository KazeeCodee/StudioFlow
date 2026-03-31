import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { plans } from "@/lib/db/schema";

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
