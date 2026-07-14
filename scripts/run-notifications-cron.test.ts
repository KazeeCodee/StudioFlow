import { describe, expect, it, vi } from "vitest";
import { runNotificationsCron } from "./run-notifications-cron.mjs";

describe("runNotificationsCron", () => {
  it("reintenta tres veces y devuelve el resumen de una respuesta exitosa", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ attempted: 3, sent: 2, skipped: 1, failed: 0 }),
      });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const log = vi.fn();

    const result = await runNotificationsCron({
      appUrl: "https://staging.studioflow.test",
      cronSecret: "cron-secret",
      fetchImpl,
      log,
      sleep,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(sleep).toHaveBeenCalledTimes(3);
    expect(fetchImpl).toHaveBeenLastCalledWith(
      "https://staging.studioflow.test/api/cron/notifications",
      expect.objectContaining({
        headers: { Authorization: "Bearer cron-secret" },
        method: "GET",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result).toEqual({ attempted: 3, sent: 2, skipped: 1, failed: 0 });
    expect(log).toHaveBeenCalledWith(
      "info",
      "notifications_cron_completed",
      expect.objectContaining({ attempt: 4, sent: 2 }),
    );
  });

  it("falla tras el intento inicial y tres reintentos sin filtrar respuestas", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const log = vi.fn();

    await expect(
      runNotificationsCron({
        appUrl: "https://staging.studioflow.test",
        cronSecret: "cron-secret",
        fetchImpl,
        log,
        sleep: vi.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toThrow("Notifications cron failed after 4 attempts.");

    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(log).toHaveBeenLastCalledWith(
      "error",
      "notifications_cron_failed",
      { attempts: 4 },
    );
  });

  it("rechaza configuracion incompleta antes de llamar al endpoint", async () => {
    const fetchImpl = vi.fn();

    await expect(
      runNotificationsCron({
        appUrl: "",
        cronSecret: "",
        fetchImpl,
      }),
    ).rejects.toThrow("APP_URL and CRON_SECRET are required.");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
