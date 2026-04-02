"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canRenewPlans } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { sendRenewalConfirmationNotification } from "@/services/notifications/dispatcher";
import { renewMemberPlan } from "@/services/renewals/renew-member-plan";

async function notifySafely(task: () => Promise<void>) {
  try {
    await task();
  } catch (error) {
    console.error("Notification delivery failed", error);
  }
}

export async function renewMemberPlanAction(formData: FormData) {
  const { profile } = await requireStaffContext();

  if (!canRenewPlans(profile.role)) {
    redirect("/admin");
  }

  const memberPlanId = String(formData.get("memberPlanId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || undefined;
  const redirectTo = String(formData.get("redirectTo") ?? "").trim() || "/admin/renewals";

  if (!memberPlanId) {
    throw new Error("Falta el plan a renovar.");
  }

  const renewal = await renewMemberPlan(
    {
      memberPlanId,
      notes,
    },
    profile,
  );
  await notifySafely(() => sendRenewalConfirmationNotification(renewal.renewalId));

  revalidatePath("/admin/renewals");
  revalidatePath("/admin");
  redirect(redirectTo);
}
