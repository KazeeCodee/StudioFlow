import { describe, expect, it } from "vitest";
import {
  canManageBookings,
  canManageMembers,
  canManagePlans,
  canManageSettings,
  canManageSpaces,
  canManageStaffUsers,
  canRenewPlans,
} from "@/lib/permissions/guards";

describe("guards", () => {
  it("permite a admin gestionar planes", () => {
    expect(canManagePlans("admin")).toBe(true);
  });

  it("bloquea a operator en settings criticos", () => {
    expect(canManageSettings("operator")).toBe(false);
    expect(canManageStaffUsers("operator")).toBe(false);
  });

  it("limita a operator a la operacion diaria", () => {
    expect(canManageBookings("operator")).toBe(true);
    expect(canManageMembers("operator")).toBe(false);
    expect(canManagePlans("operator")).toBe(false);
    expect(canManageSpaces("operator")).toBe(false);
    expect(canRenewPlans("operator")).toBe(false);
  });
});
