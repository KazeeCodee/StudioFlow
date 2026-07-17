import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialFormActionState } from "@/lib/form-action-state";

const revalidatePath = vi.fn();
const redirect = vi.fn();
const requireStaffContext = vi.fn();
const createMemberWithPlan = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/modules/auth/queries", () => ({ requireStaffContext }));
vi.mock("@/services/members/create-member-with-plan", () => ({ createMemberWithPlan }));

function createMemberForm() {
  const formData = new FormData();
  formData.set("fullName", "Ana Perez");
  formData.set("email", "ana@example.com");
  formData.set("phone", "+54 11 5555 5555");
  formData.set("password", "clave-segura");
  formData.set("status", "active");
  formData.set("planId", "00000000-0000-4000-8000-000000000001");
  formData.set("notes", "");
  return formData;
}

describe("member creation action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaffContext.mockResolvedValue({
      profile: { id: "profile-1", role: "admin" },
    });
    createMemberWithPlan.mockResolvedValue({
      memberId: "member-1",
      memberPlanId: "member-plan-1",
    });
  });

  it("crea el miembro y navega a su detalle", async () => {
    const { createMemberAction } = await import("@/modules/members/actions");

    await createMemberAction(initialFormActionState, createMemberForm());

    expect(createMemberWithPlan).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/admin/members/member-1");
  });

  it("devuelve el fallo de creacion dentro del formulario", async () => {
    createMemberWithPlan.mockRejectedValue(new Error("El email ya esta registrado."));
    const { createMemberAction } = await import("@/modules/members/actions");

    const result = await createMemberAction(initialFormActionState, createMemberForm());

    expect(result).toEqual({
      status: "error",
      message: "El email ya esta registrado.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

