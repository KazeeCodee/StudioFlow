"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { auditLogs, memberPlans, plans } from "@/lib/db/schema";
import { canManagePlans } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import type { AppRole } from "@/modules/auth/types";
import { planSchema, planStatusUpdateSchema } from "@/modules/plans/schema";
import { buildPlanWriteValues } from "@/services/plans/build-plan-write-values";

function revalidatePlanPaths(planId?: string) {
  revalidatePath("/admin/plans");
  revalidatePath("/admin/plans/new");

  if (planId) {
    revalidatePath(`/admin/plans/${planId}`);
  }
}

function assertCanManagePlans(role: AppRole) {
  if (!canManagePlans(role)) {
    redirect("/admin");
  }
}

export async function createPlanAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManagePlans(profile.role);
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
  const values = buildPlanWriteValues(input);

  const db = getDb();
  const [createdPlan] = await db
    .insert(plans)
    .values(values)
    .returning({ id: plans.id, name: plans.name });

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "plan.created",
    entityType: "plan",
    entityId: createdPlan.id,
    metadata: { name: createdPlan.name },
  });

  revalidatePlanPaths();
}

export async function updatePlanAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManagePlans(profile.role);
  const planId = String(formData.get("planId") ?? "");
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

  if (!planId) {
    throw new Error("Falta el plan a actualizar.");
  }

  const db = getDb();
  const [currentPlan] = await db
    .select({
      id: plans.id,
      name: plans.name,
      status: plans.status,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!currentPlan) {
    throw new Error("No encontramos el plan solicitado.");
  }

  const values = buildPlanWriteValues(input);

  await db.update(plans).set(values).where(eq(plans.id, planId));

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "plan.updated",
    entityType: "plan",
    entityId: planId,
    metadata: {
      previousName: currentPlan.name,
      previousStatus: currentPlan.status,
      name: values.name,
      status: values.status,
    },
  });

  revalidatePlanPaths(planId);
  redirect(`/admin/plans/${planId}`);
}

export async function updatePlanStatusAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManagePlans(profile.role);
  const planId = String(formData.get("planId") ?? "");
  const input = planStatusUpdateSchema.parse({
    status: formData.get("status"),
    reason: formData.get("reason"),
  });

  if (!planId) {
    throw new Error("Falta el plan a actualizar.");
  }

  const db = getDb();
  const [currentPlan] = await db
    .select({
      id: plans.id,
      status: plans.status,
      name: plans.name,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!currentPlan) {
    throw new Error("No encontramos el plan solicitado.");
  }

  await db
    .update(plans)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(plans.id, planId));

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "plan.status_changed",
    entityType: "plan",
    entityId: planId,
    metadata: {
      name: currentPlan.name,
      previousStatus: currentPlan.status,
      status: input.status,
      reason: input.reason ?? null,
    },
  });

  revalidatePlanPaths(planId);
  redirect(`/admin/plans/${planId}`);
}

export async function deletePlanAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  assertCanManagePlans(profile.role);

  const planId = String(formData.get("planId") ?? "");

  if (!planId) {
    throw new Error("Falta el plan a eliminar.");
  }

  const db = getDb();
  const [currentPlan] = await db
    .select({
      id: plans.id,
      name: plans.name,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!currentPlan) {
    throw new Error("No encontramos el plan solicitado.");
  }

  const [{ memberPlanCount }] = await db
    .select({ memberPlanCount: count() })
    .from(memberPlans)
    .where(eq(memberPlans.planId, planId));

  if (memberPlanCount > 0) {
    throw new Error("No se puede eliminar el plan mientras esté asignado a miembros.");
  }

  await db.delete(plans).where(eq(plans.id, planId));

  await db.insert(auditLogs).values({
    actorId: profile.id,
    actorRole: profile.role,
    action: "plan.deleted",
    entityType: "plan",
    entityId: planId,
    metadata: {
      name: currentPlan.name,
    },
  });

  revalidatePlanPaths();
  redirect("/admin/plans");
}
