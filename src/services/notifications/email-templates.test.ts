import { describe, expect, it } from "vitest";
import {
  renderBookingTransactionalEmail,
  renderMemberReminderEmail,
  renderSystemTestEmail,
} from "@/services/notifications/email-templates";

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

describe("renderBookingTransactionalEmail", () => {
  it("usa el horario vigente cuando una reserva fue reprogramada", () => {
    const result = renderBookingTransactionalEmail({
      memberName: "Ana Perez",
      spaceName: "Sala Podcast",
      startsAt: new Date("2026-04-04T12:00:00Z"),
      endsAt: new Date("2026-04-04T14:00:00Z"),
      actionLabel: "reprogramada",
      appUrl: "https://studioflow.app",
    });

    expect(result.subject).toContain("reprogramada");
    expect(result.text).toContain("Horario vigente");
    expect(result.html).toContain("/member/bookings");
  });
});

describe("renderSystemTestEmail", () => {
  it("muestra el modo de transporte activo", () => {
    const result = renderSystemTestEmail({
      recipientName: "Walter Admin",
      appUrl: "https://studioflow.app",
      transportMode: "resend",
    });

    expect(result.subject).toContain("prueba");
    expect(result.text).toContain("resend");
    expect(result.html).toContain("/admin/settings");
  });
});
