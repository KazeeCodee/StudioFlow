"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffContext } from "@/modules/auth/queries";
import { renewMemberPlan } from "@/services/renewals/renew-member-plan";

export async function renewMemberPlanAction(formData: FormData) {
  const { profile } = await requireStaffContext();
  const memberPlanId = String(formData.get("memberPlanId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const redirectTo = String(formData.get("redirectTo") ?? "").trim() || "/admin/renewals";

  if (!memberPlanId) {
    throw new Error("Falta el plan a renovar.");
  }

  await renewMemberPlan(
    {
      memberPlanId,
      notes,
    },
    profile,
  );

  revalidatePath("/admin/renewals");
  revalidatePath("/admin");
  redirect(redirectTo);
}
