import { describe, expect, it } from "vitest";
import { buildChangedPlanSnapshot } from "@/services/members/change-member-plan";

describe("buildChangedPlanSnapshot", () => {
  it("starts the new plan with the target plan quota", () => {
    const startsAt = new Date("2026-04-01T12:00:00.000Z");

    const result = buildChangedPlanSnapshot({
      startsAt,
      durationType: "monthly",
      durationValue: 1,
      quotaAmount: 20,
    });

    expect(result.quotaTotal).toBe(20);
    expect(result.quotaRemaining).toBe(20);
    expect(result.quotaUsed).toBe(0);
    expect(result.nextPaymentDueAt).toEqual(result.endsAt);
  });

  it("adds custom duration in days", () => {
    const startsAt = new Date("2026-04-01T12:00:00.000Z");

    const result = buildChangedPlanSnapshot({
      startsAt,
      durationType: "custom",
      durationValue: 10,
      quotaAmount: 6,
    });

    expect(result.endsAt.toISOString()).toBe("2026-04-11T12:00:00.000Z");
  });
});
