import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialFormActionState } from "@/lib/form-action-state";

const revalidatePath = vi.fn();
const redirect = vi.fn();
const requireStaffContext = vi.fn();
const planReturning = vi.fn(async () => [{ id: "plan-1", name: "Plan Produccion" }]);
const planValues = vi.fn(() => ({ returning: planReturning }));
const auditValues = vi.fn(async () => undefined);
const insert = vi.fn();
const getDb = vi.fn(() => ({ insert }));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/db", () => ({ getDb }));
vi.mock("@/modules/auth/queries", () => ({ requireStaffContext }));

function createPlanForm(name = "Plan Produccion") {
  const formData = new FormData();
  formData.set("name", name);
  formData.set("description", "Plan mensual");
  formData.set("status", "active");
  formData.set("durationType", "monthly");
  formData.set("durationValue", "1");
  formData.set("quotaAmount", "12");
  formData.set("price", "");
  formData.set("cancellationPolicyHours", "24");
  formData.set("maxBookingsPerDay", "");
  formData.set("maxBookingsPerWeek", "");
  return formData;
}

describe("plan creation action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffContext.mockResolvedValue({
      profile: { id: "profile-1", role: "admin" },
    });
    insert
      .mockReturnValueOnce({ values: planValues })
      .mockReturnValueOnce({ values: auditValues });
  });

  it("crea el plan y navega a su detalle", async () => {
    const { createPlanAction } = await import("@/modules/plans/actions");

    await createPlanAction(initialFormActionState, createPlanForm());

    expect(planReturning).toHaveBeenCalledTimes(1);
    expect(auditValues).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/admin/plans/plan-1");
  });

  it("devuelve los errores de validacion sin abrir la pantalla global", async () => {
    const { createPlanAction } = await import("@/modules/plans/actions");

    const result = await createPlanAction(initialFormActionState, createPlanForm("P"));

    expect(result).toEqual({
      status: "error",
      message: "El nombre es obligatorio.",
    });
    expect(insert).not.toHaveBeenCalled();
  });
});

