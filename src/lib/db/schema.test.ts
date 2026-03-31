import { describe, expect, it } from "vitest";
import { bookings, memberPlans, plans, spaces } from "@/lib/db/schema";

describe("schema", () => {
  it("define las tablas clave del negocio", () => {
    expect(plans).toBeDefined();
    expect(memberPlans).toBeDefined();
    expect(spaces).toBeDefined();
    expect(bookings).toBeDefined();
  });
});
