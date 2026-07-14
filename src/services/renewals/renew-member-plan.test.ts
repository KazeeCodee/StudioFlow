import { describe, expect, it } from "vitest";
import {
  buildRenewalSnapshot,
  calculateRenewalEndDate,
} from "@/services/renewals/renew-member-plan";

describe("renew-member-plan", () => {
  it("reinicia cupos con el total del plan", () => {
    const result = buildRenewalSnapshot({
      oldQuotaRemaining: 2,
      newQuotaTotal: 10,
    });

    expect(result.quotaRemaining).toBe(10);
  });

  it("ajusta una renovacion mensual al ultimo dia valido", () => {
    expect(
      calculateRenewalEndDate({
        anchorDate: new Date("2027-01-31T12:00:00.000Z"),
        durationType: "monthly",
        durationValue: 1,
      }),
    ).toEqual(new Date("2027-02-28T12:00:00.000Z"));
  });

  it("conserva el 29 de febrero durante un ano bisiesto", () => {
    expect(
      calculateRenewalEndDate({
        anchorDate: new Date("2028-01-31T12:00:00.000Z"),
        durationType: "monthly",
        durationValue: 1,
      }),
    ).toEqual(new Date("2028-02-29T12:00:00.000Z"));
  });

  it("aplica duraciones semanales y personalizadas", () => {
    expect(
      calculateRenewalEndDate({
        anchorDate: new Date("2026-07-14T12:00:00.000Z"),
        durationType: "weekly",
        durationValue: 2,
      }),
    ).toEqual(new Date("2026-07-28T12:00:00.000Z"));
    expect(
      calculateRenewalEndDate({
        anchorDate: new Date("2026-07-14T12:00:00.000Z"),
        durationType: "custom",
        durationValue: 10,
      }),
    ).toEqual(new Date("2026-07-24T12:00:00.000Z"));
  });
});
