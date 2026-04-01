import { describe, expect, it } from "vitest";
import { buildDailyNotificationPlan } from "@/services/notifications/build-daily-notification-plan";

describe("buildDailyNotificationPlan", () => {
  it("crea un digest para staff y consolida motivos por miembro", () => {
    const result = buildDailyNotificationPlan({
      dateKey: "2026-03-31",
      staffRecipients: [
        {
          email: "admin@studioflow.com",
          fullName: "Admin Uno",
        },
      ],
      upcomingRenewals: [
        {
          memberPlanId: "plan-1",
          memberName: "Ana Perez",
          memberEmail: "ana@studioflow.com",
          planName: "Plan Creator",
          nextPaymentDueAt: new Date("2026-04-02T12:00:00Z"),
          quotaRemaining: 2,
        },
      ],
      lowQuotaPlans: [
        {
          memberPlanId: "plan-1",
          memberName: "Ana Perez",
          memberEmail: "ana@studioflow.com",
          planName: "Plan Creator",
          nextPaymentDueAt: new Date("2026-04-02T12:00:00Z"),
          quotaRemaining: 2,
        },
      ],
    });

    expect(result.staffDigestDeliveries).toHaveLength(1);
    expect(result.staffDigestDeliveries[0]?.dedupeKey).toBe(
      "staff-digest:admin@studioflow.com:2026-03-31",
    );
    expect(result.memberReminderDeliveries).toHaveLength(1);
    expect(result.memberReminderDeliveries[0]?.dedupeKey).toBe(
      "member-reminder:plan-1:2026-03-31",
    );
    expect(result.memberReminderDeliveries[0]?.reasons).toEqual([
      "renewal_due",
      "low_quota",
    ]);
  });
});
