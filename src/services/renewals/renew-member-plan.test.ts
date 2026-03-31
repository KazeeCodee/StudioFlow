import { describe, expect, it } from "vitest";
import { buildRenewalSnapshot } from "@/services/renewals/renew-member-plan";

describe("renew-member-plan", () => {
  it("reinicia cupos con el total del plan", () => {
    const result = buildRenewalSnapshot({
      oldQuotaRemaining: 2,
      newQuotaTotal: 10,
    });

    expect(result.quotaRemaining).toBe(10);
  });
});
