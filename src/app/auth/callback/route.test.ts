import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const verifyOtp = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({
  auth: {
    exchangeCodeForSession,
    verifyOtp,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSession.mockResolvedValue({ error: null });
    verifyOtp.mockResolvedValue({ error: null });
  });

  it("intercambia el code y redirige al destino indicado", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest(
      "https://studioflow.test/auth/callback?code=pkce-code&next=/reset-password",
    );

    const response = await GET(request);

    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(response.headers.get("location")).toBe("https://studioflow.test/reset-password");
  });

  it("redirige con error si no puede abrir la sesion de recovery", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({
      error: new Error("exchange failed"),
    });

    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest(
      "https://studioflow.test/auth/callback?code=pkce-code&next=/reset-password",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "https://studioflow.test/reset-password?error=auth_callback_failed",
    );
  });
});
