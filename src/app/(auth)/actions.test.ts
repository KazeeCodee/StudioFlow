import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const consumeRateLimit = vi.fn();
const createSupabaseServerClient = vi.fn();

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "198.51.100.24" }),
}));
vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit,
  logRateLimitUnavailable: vi.fn(),
  redisRateLimitStore: {},
}));
vi.mock("@/lib/request-identity", () => ({
  buildRateLimitKey: () => "rate-limit:auth:test-hash",
  getTrustedClientIp: () => "198.51.100.24",
  normalizeAccountIdentifier: (value: string) => value.trim().toLowerCase(),
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimit.mockResolvedValue({
      allowed: true,
      reason: "allowed",
      remaining: 4,
      retryAfterSeconds: 900,
    });
  });

  it("no refleja un next externo en el redirect de error", async () => {
    const { loginAction } = await import("@/app/(auth)/actions");
    const formData = new FormData();
    formData.set("next", "https://evil.example/phishing");

    await expect(loginAction(formData)).rejects.toThrow(
      "REDIRECT:/login?error=missing_credentials",
    );
  });

  it("corta el login cuando se excede el limite", async () => {
    consumeRateLimit.mockResolvedValue({
      allowed: false,
      reason: "exceeded",
      remaining: 0,
      retryAfterSeconds: 900,
    });
    const { loginAction } = await import("@/app/(auth)/actions");
    const formData = new FormData();
    formData.set("email", "member@example.com");
    formData.set("password", "secret-password");

    await expect(loginAction(formData)).rejects.toThrow(
      "REDIRECT:/login?error=rate_limited",
    );
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("falla cerrado en recuperacion cuando Redis no esta disponible", async () => {
    consumeRateLimit.mockResolvedValue({
      allowed: false,
      reason: "unavailable",
      remaining: 0,
      retryAfterSeconds: 3600,
    });
    const { forgotPasswordAction } = await import("@/app/(auth)/actions");
    const formData = new FormData();
    formData.set("email", "member@example.com");

    await expect(forgotPasswordAction(formData)).rejects.toThrow(
      "REDIRECT:/forgot-password?error=temporarily_unavailable",
    );
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });
});
