import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendDailyReminderNotifications = vi.fn();
const getEnv = vi.fn();

vi.mock("@/services/notifications/dispatcher", () => ({
  sendDailyReminderNotifications,
}));

vi.mock("@/lib/env", () => ({
  getEnv,
}));

describe("GET /api/cron/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEnv.mockReturnValue({
      CRON_SECRET: "cron-secret",
    });
    sendDailyReminderNotifications.mockResolvedValue({
      staffDigestCount: 1,
      memberReminderCount: 2,
      attempted: 3,
      sent: 2,
      skipped: 1,
      failed: 0,
    });
  });

  it("rechaza requests sin el bearer esperado", async () => {
    const { GET } = await import("@/app/api/cron/notifications/route");
    const request = new NextRequest("https://studioflow.test/api/cron/notifications");

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("ejecuta el flujo diario y devuelve el resumen", async () => {
    const { GET } = await import("@/app/api/cron/notifications/route");
    const request = new NextRequest("https://studioflow.test/api/cron/notifications", {
      headers: {
        authorization: "Bearer cron-secret",
      },
    });

    const response = await GET(request);
    const body = await response.json();

    expect(sendDailyReminderNotifications).toHaveBeenCalled();
    expect(body).toEqual({
      ok: true,
      staffDigestCount: 1,
      memberReminderCount: 2,
      attempted: 3,
      sent: 2,
      skipped: 1,
      failed: 0,
    });
  });
});
