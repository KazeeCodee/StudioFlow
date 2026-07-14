import { describe, expect, it } from "vitest";
import { buildRenewalPreview } from "@/modules/renewals/calendar";

describe("buildRenewalPreview", () => {
  it("calcula fechas y cupos que vera el administrador antes de confirmar", () => {
    const result = buildRenewalPreview({
      now: new Date("2027-01-15T12:00:00.000Z"),
      currentEndDate: new Date("2027-01-31T12:00:00.000Z"),
      durationType: "monthly",
      durationValue: 1,
      quotaAmount: 12,
    });

    expect(result.newEndDate).toEqual(new Date("2027-02-28T12:00:00.000Z"));
    expect(result.quotaRemaining).toBe(12);
    expect(result.quotaUsed).toBe(0);
  });
});
