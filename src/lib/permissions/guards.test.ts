import { describe, expect, it } from "vitest";
import { canManagePlans, canManageSettings } from "@/lib/permissions/guards";

describe("guards", () => {
  it("permite a admin gestionar planes", () => {
    expect(canManagePlans("admin")).toBe(true);
  });

  it("bloquea a operator en settings críticos", () => {
    expect(canManageSettings("operator")).toBe(false);
  });
});
