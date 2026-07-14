import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("emite un registro JSON estructurado", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.info("notification_summary", {
      correlationId: "request-123",
      sent: 2,
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(infoSpy.mock.calls[0][0]))).toEqual(
      expect.objectContaining({
        event: "notification_summary",
        severity: "info",
        correlationId: "request-123",
        sent: 2,
        timestamp: expect.any(String),
      }),
    );
  });

  it("redacta secretos, credenciales, cookies y cuerpos en cualquier nivel", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("provider_failure", {
      authorization: "Bearer secret",
      cookie: "session=secret",
      credentials: { password: "secret" },
      email: { html: "<p>privado</p>", text: "privado" },
      provider: { responseBody: "detalle privado" },
      safeStatus: 502,
    });

    const serialized = String(errorSpy.mock.calls[0][0]);
    const record = JSON.parse(serialized);

    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("privado");
    expect(record).toEqual(
      expect.objectContaining({
        authorization: "[REDACTED]",
        cookie: "[REDACTED]",
        safeStatus: 502,
      }),
    );
    expect(record.credentials.password).toBe("[REDACTED]");
    expect(record.email.html).toBe("[REDACTED]");
    expect(record.provider.responseBody).toBe("[REDACTED]");
  });
});
