import { beforeEach, describe, expect, it, vi } from "vitest";
import { RenewalConflictError } from "@/services/renewals/errors";

const revalidatePath = vi.fn();
const requireStaffContext = vi.fn();
const renewMemberPlan = vi.fn();
const sendRenewalConfirmationNotification = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/modules/auth/queries", () => ({ requireStaffContext }));
vi.mock("@/services/renewals/renew-member-plan", () => ({ renewMemberPlan }));
vi.mock("@/services/notifications/dispatcher", () => ({
  sendRenewalConfirmationNotification,
}));

const initialState = { status: "idle" as const, message: "" };

function createPaymentForm() {
  const formData = new FormData();
  formData.set("memberPlanId", "68fae66e-3471-4f63-b9ed-4f5d2ea1b0ce");
  formData.set("expectedNextPaymentDueAt", "2026-07-14T15:00:00.000Z");
  formData.set("amountReceived", "25000");
  formData.set("currency", "ARS");
  formData.set("paymentMethod", "bank_transfer");
  formData.set("paidAt", "2026-07-14T12:00:00.000Z");
  formData.set("externalReference", "TRX-8821");
  formData.set("paymentVerified", "true");
  return formData;
}

describe("renewMemberPlanAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffContext.mockResolvedValue({
      profile: { id: "f4e3b8cc-faaa-4a1d-81ac-3c86736bddad", role: "admin" },
    });
  });

  it("devuelve errores de campo sin ejecutar una renovacion invalida", async () => {
    const { renewMemberPlanAction } = await import("@/modules/renewals/actions");
    const formData = createPaymentForm();
    formData.delete("paymentVerified");

    const result = await renewMemberPlanAction(initialState, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.paymentVerified).toBeDefined();
    expect(renewMemberPlan).not.toHaveBeenCalled();
  });

  it("devuelve el resultado y el estado de notificacion", async () => {
    const { renewMemberPlanAction } = await import("@/modules/renewals/actions");
    renewMemberPlan.mockResolvedValue({
      renewalId: "renewal-1",
      memberName: "Ana Perez",
      newEndDate: new Date("2026-08-14T15:00:00.000Z"),
      quotaRemaining: 10,
    });
    sendRenewalConfirmationNotification.mockResolvedValue("sent");

    const result = await renewMemberPlanAction(initialState, createPaymentForm());

    expect(result).toEqual(expect.objectContaining({
      status: "success",
      renewalId: "renewal-1",
      memberName: "Ana Perez",
      notificationStatus: "sent",
    }));
    expect(revalidatePath).not.toHaveBeenCalledWith("/admin/renewals");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("convierte conflictos concurrentes en un mensaje recuperable", async () => {
    const { renewMemberPlanAction } = await import("@/modules/renewals/actions");
    renewMemberPlan.mockRejectedValue(new RenewalConflictError());

    const result = await renewMemberPlanAction(initialState, createPaymentForm());

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/actualizado por otra operacion/i);
  });

  it("conserva el exito financiero cuando falla toda la notificacion", async () => {
    const { renewMemberPlanAction } = await import("@/modules/renewals/actions");
    renewMemberPlan.mockResolvedValue({
      renewalId: "renewal-2",
      memberName: "Ana Perez",
      newEndDate: new Date("2026-08-14T15:00:00.000Z"),
      quotaRemaining: 10,
    });
    sendRenewalConfirmationNotification.mockRejectedValue(new Error("context unavailable"));

    const result = await renewMemberPlanAction(initialState, createPaymentForm());

    expect(result.status).toBe("success");
    expect(result.notificationStatus).toBe("failed");
    expect(result.message).toMatch(/no pudimos enviar el correo/i);
  });
});
