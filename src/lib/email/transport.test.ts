import { beforeEach, describe, expect, it, vi } from "vitest";

const mockEnv = vi.hoisted(() => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/postgres",
    APP_URL: "http://localhost:3000",
    EMAIL_TRANSPORT_MODE: "log" as "log" | "resend",
    EMAIL_FROM: "StudioFlow <no-reply@example.com>",
    RESEND_API_KEY: "re_test_123",
  },
}));

const loggerInfo = vi.hoisted(() => vi.fn());
const loggerError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", () => ({
  getEnv: () => mockEnv.env,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: loggerError,
    info: loggerInfo,
  },
}));

describe("sendEmail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockEnv.env.EMAIL_TRANSPORT_MODE = "log";
    mockEnv.env.EMAIL_FROM = "StudioFlow <no-reply@example.com>";
    mockEnv.env.RESEND_API_KEY = "re_test_123";
  });

  it("omite el envio en modo log", async () => {
    const { sendEmail } = await import("@/lib/email/transport");

    const result = await sendEmail({
      to: "ana@studioflow.com",
      subject: "Test",
      html: "<p>Hola</p>",
      text: "Hola",
    });

    expect(result).toEqual({
      status: "skipped",
      reason: "Email transport in log mode.",
    });
    expect(loggerInfo).toHaveBeenCalledWith("email_delivery_skipped", {
      mode: "log",
    });
  });

  it("envia por Resend y propaga la clave de idempotencia", async () => {
    mockEnv.env.EMAIL_TRANSPORT_MODE = "resend";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { sendEmail } = await import("@/lib/email/transport");
    const result = await sendEmail({
      to: "ana@studioflow.com",
      subject: "Reserva confirmada",
      html: "<p>Hola</p>",
      text: "Hola",
      idempotencyKey: "delivery-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_123",
          "Content-Type": "application/json",
          "Idempotency-Key": "delivery-1",
        }),
      }),
    );
    expect(result).toEqual({
      status: "sent",
      providerMessageId: "email_123",
    });
  });

  it("falla en vez de omitir cuando falta la configuracion de Resend", async () => {
    mockEnv.env.EMAIL_TRANSPORT_MODE = "resend";
    mockEnv.env.RESEND_API_KEY = "";
    const { sendEmail } = await import("@/lib/email/transport");

    await expect(
      sendEmail({
        to: "ana@studioflow.com",
        subject: "Test",
        html: "<p>Privado</p>",
        text: "Privado",
      }),
    ).rejects.toThrow("Email provider is not configured.");
  });

  it("no propaga el cuerpo de error del proveedor", async () => {
    mockEnv.env.EMAIL_TRANSPORT_MODE = "resend";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => "provider-secret-body",
      }),
    );
    const { sendEmail } = await import("@/lib/email/transport");

    await expect(
      sendEmail({
        to: "ana@studioflow.com",
        subject: "Test",
        html: "<p>Privado</p>",
        text: "Privado",
      }),
    ).rejects.toThrow("No se pudo enviar el email.");

    expect(loggerError).toHaveBeenCalledWith("email_provider_rejected", {
      provider: "resend",
      status: 502,
    });
  });
});
