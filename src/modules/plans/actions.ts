"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { auditLogs, plans } from "@/lib/db/schema";
import { requireStaffContext } from "@/modules/auth/queries";
import { planSchema } from "@/modules/plans/schema";

export async function createPlanAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  const input = planSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status"),
    durationType: formData.get("durationType"),
    durationValue: formData.get("durationValue"),
    quotaAmount: formData.get("quotaAmount"),
    price: formData.get("price"),
    cancellationPolicyHours: formData.get("cancellationPolicyHours"),
    maxBookingsPerDay: formData.get("maxBookingsPerDay"),
    maxBookingsPerWeek: formData.get("maxBookingsPerWeek"),
  });

  const db = getDb();
  const [createdPlan] = await db
    .insert(plans)
    .values({
      name: input.name,
      description: input.description,
      status: input.status,
      durationType: input.durationType,
      durationValue: input.durationValue,
      quotaAmount: input.quotaAmount,
      price: input.price === null ? null : input.price.toFixed(2),
      cancellationPolicyHours: input.cancellationPolicyHours,
      maxBookingsPerDay: input.maxBookingsPerDay,
      maxBookingsPerWeek: input.maxBookingsPerWeek,
    })
    .returning({ id: plans.id, name: plans.name });

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "plan.created",
    entityType: "plan",
    entityId: createdPlan.id,
    metadata: { name: createdPlan.name },
  });

  revalidatePath("/admin/plans");
  revalidatePath("/admin/plans/new");
}
