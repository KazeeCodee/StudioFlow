import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const createServerClient = vi.fn(() => ({
  auth: {
    getUser,
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://studioflow.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  }),
}));

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("revalida la sesion consultando auth.getUser", async () => {
    const { updateSession } = await import("@/lib/supabase/proxy");
    const request = new NextRequest("https://studioflow.test/admin");

    const response = await updateSession(request);

    expect(createServerClient).toHaveBeenCalled();
    expect(getUser).toHaveBeenCalled();
    expect(response).toBeDefined();
  });

  it("conserva los headers internos al refrescar cookies", async () => {
    const { updateSession } = await import("@/lib/supabase/proxy");
    const request = new NextRequest("https://studioflow.test/member");
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("content-security-policy", "script-src 'nonce-test'");

    const response = await updateSession(request, requestHeaders);

    expect(
      response.headers.get("x-middleware-request-content-security-policy"),
    ).toBe("script-src 'nonce-test'");
  });
});
