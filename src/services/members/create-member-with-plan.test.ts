import { describe, expect, it } from "vitest";
import { calculateInitialQuota } from "@/services/members/create-member-with-plan";

describe("create-member-with-plan", () => {
  it("usa los cupos del plan como cuota inicial", () => {
    expect(calculateInitialQuota({ quotaAmount: 12 })).toBe(12);
  });
});
