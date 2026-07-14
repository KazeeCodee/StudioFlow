"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canRenewPlans } from "@/lib/permissions/guards";
import { requireStaffContext } from "@/modules/auth/queries";
import { renewalPaymentSchema } from "@/modules/renewals/schema";
import { sendRenewalConfirmationNotification } from "@/services/notifications/dispatcher";
import { RenewalConflictError } from "@/services/renewals/errors";
import { renewMemberPlan } from "@/services/renewals/renew-member-plan";

export type RenewalActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
  renewalId?: string;
  memberName?: string;
  newEndDate?: string;
  quotaRemaining?: number;
  notificationStatus?: "sent" | "skipped" | "failed";
};

export const initialRenewalActionState: RenewalActionState = {
  status: "idle",
  message: "",
};

export async function renewMemberPlanAction(
  _previousState: RenewalActionState,
  formData: FormData,
): Promise<RenewalActionState> {
  const { profile } = await requireStaffContext();

  if (!canRenewPlans(profile.role)) {
    redirect("/admin");
  }

  const parsed = renewalPaymentSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los datos del pago antes de continuar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let renewal;

  try {
    renewal = await renewMemberPlan(parsed.data, profile);
  } catch (error) {
    if (error instanceof RenewalConflictError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    throw error;
  }

  let notificationStatus: "sent" | "skipped" | "failed";

  try {
    notificationStatus = await sendRenewalConfirmationNotification(
      renewal.renewalId,
    );
  } catch (error) {
    console.error("Renewal notification failed after a committed renewal", error);
    notificationStatus = "failed";
  }

  revalidatePath("/admin");

  const message =
    notificationStatus === "sent"
      ? `Pago confirmado y plan de ${renewal.memberName} renovado.`
      : notificationStatus === "skipped"
        ? `El plan de ${renewal.memberName} fue renovado. La notificación por correo fue omitida.`
        : `El plan de ${renewal.memberName} fue renovado, pero no pudimos enviar el correo.`;

  return {
    status: "success",
    message,
    renewalId: renewal.renewalId,
    memberName: renewal.memberName,
    newEndDate: renewal.newEndDate.toISOString(),
    quotaRemaining: renewal.quotaRemaining,
    notificationStatus,
  };
}
