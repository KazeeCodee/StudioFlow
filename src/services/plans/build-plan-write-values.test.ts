import { describe, expect, it } from "vitest";
import { buildPlanWriteValues } from "@/services/plans/build-plan-write-values";

describe("buildPlanWriteValues", () => {
  it("serializes numeric price to fixed decimals", () => {
    const result = buildPlanWriteValues({
      name: "Plan Pro",
      description: "Incluye prioridad de agenda",
      status: "active",
      durationType: "monthly",
      durationValue: 1,
      quotaAmount: 20,
      price: 12500,
      cancellationPolicyHours: 24,
      maxBookingsPerDay: 2,
      maxBookingsPerWeek: 5,
    });

    expect(result.price).toBe("12500.00");
    expect(result.maxBookingsPerDay).toBe(2);
  });

  it("keeps nullable fields as null", () => {
    const result = buildPlanWriteValues({
      name: "Plan Base",
      description: undefined,
      status: "draft",
      durationType: "monthly",
      durationValue: 1,
      quotaAmount: 8,
      price: null,
      cancellationPolicyHours: 12,
      maxBookingsPerDay: null,
      maxBookingsPerWeek: null,
    });

    expect(result.price).toBeNull();
    expect(result.maxBookingsPerDay).toBeNull();
    expect(result.maxBookingsPerWeek).toBeNull();
  });
});
