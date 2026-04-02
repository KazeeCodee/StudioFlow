import { describe, expect, it } from "vitest";
import { memberQuotaAdjustmentSchema } from "@/modules/members/schema";

describe("memberQuotaAdjustmentSchema", () => {
  it("accepts positive and negative deltas with a note", () => {
    const result = memberQuotaAdjustmentSchema.safeParse({
      delta: -2,
      reason: "Correccion manual",
    });

    expect(result.success).toBe(true);
  });
});
