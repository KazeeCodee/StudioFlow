import { describe, expect, it } from "vitest";
import {
  memberPlanChangeSchema,
  memberQuotaAdjustmentSchema,
  memberSchema,
} from "@/modules/members/schema";

const baseMember = {
  fullName: "Ana Pérez",
  email: "ana@example.com",
  password: "password-segura",
  status: "active" as const,
};

describe("memberSchema", () => {
  it("acepta un plan válido", () => {
    const input = memberSchema.parse({
      ...baseMember,
      planId: "11111111-1111-4111-8111-111111111111",
    });

    expect(input.planId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("acepta el alta sin plan y normaliza el valor vacío", () => {
    expect(memberSchema.parse({ ...baseMember, planId: "" }).planId).toBeUndefined();
    expect(memberSchema.parse(baseMember).planId).toBeUndefined();
  });

  it("rechaza un identificador de plan inválido", () => {
    expect(memberSchema.safeParse({ ...baseMember, planId: "plan-invalido" }).success).toBe(false);
  });
});

describe("memberPlanChangeSchema", () => {
  it("continúa exigiendo un plan válido para cambiarlo", () => {
    expect(memberPlanChangeSchema.safeParse({ planId: "" }).success).toBe(false);
  });
});

describe("memberQuotaAdjustmentSchema", () => {
  it("accepts positive and negative deltas with a note", () => {
    const result = memberQuotaAdjustmentSchema.safeParse({
      delta: -2,
      reason: "Correccion manual",
    });

    expect(result.success).toBe(true);
  });
});
