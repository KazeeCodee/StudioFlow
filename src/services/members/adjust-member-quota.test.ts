import { describe, expect, it } from "vitest";
import { buildQuotaAdjustmentSnapshot } from "@/services/members/adjust-member-quota";

describe("buildQuotaAdjustmentSnapshot", () => {
  it("adjusts remaining and total quota while preserving used quota", () => {
    const result = buildQuotaAdjustmentSnapshot({
      quotaTotal: 12,
      quotaUsed: 4,
      quotaRemaining: 8,
      delta: 3,
    });

    expect(result).toEqual({
      quotaTotal: 15,
      quotaUsed: 4,
      quotaRemaining: 11,
    });
  });

  it("rejects adjustments that leave remaining quota below zero", () => {
    expect(() =>
      buildQuotaAdjustmentSnapshot({
        quotaTotal: 12,
        quotaUsed: 10,
        quotaRemaining: 2,
        delta: -3,
      }),
    ).toThrow("Los cupos restantes no pueden quedar en negativo.");
  });
});
