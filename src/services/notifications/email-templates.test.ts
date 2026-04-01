import { describe, expect, it } from "vitest";
import { renderMemberReminderEmail } from "@/services/notifications/email-templates";

describe("renderMemberReminderEmail", () => {
  it("menciona vencimiento y cupos cuando ambos aplican", () => {
    const result = renderMemberReminderEmail({
      memberName: "Ana Perez",
      planName: "Plan Creator",
      nextPaymentDueAt: new Date("2026-04-02T12:00:00Z"),
      quotaRemaining: 2,
      reasons: ["renewal_due", "low_quota"],
      appUrl: "https://studioflow.app/member",
    });

    expect(result.subject).toContain("Plan Creator");
    expect(result.text).toContain("vence");
    expect(result.text).toContain("2 cupos");
    expect(result.html).toContain("Ana Perez");
    expect(result.html).toContain("studioflow.app/member");
  });
});
