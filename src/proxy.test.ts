import { NextRequest, NextResponse } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateSession = vi.fn(
  async (_request: NextRequest, requestHeaders?: Headers) =>
    NextResponse.next({ request: { headers: requestHeaders } }),
);

vi.mock("@/lib/supabase/proxy", () => ({ updateSession }));

const baselineHeaders = {
  "content-security-policy": "default-src 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "x-frame-options": "DENY",
};

function expectSecurityHeaders(response: NextResponse) {
  for (const [name, value] of Object.entries(baselineHeaders)) {
    expect(response.headers.get(name)).toContain(value);
  }
}

describe("proxy security headers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://studioflow.supabase.co";
    delete process.env.CSP_REPORT_ONLY;
  });

  it("aplica headers a una pagina publica y pasa el CSP al render", async () => {
    const { proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://studioflow.test/login"));

    expectSecurityHeaders(response);
    expect(
      response.headers.get("x-middleware-request-content-security-policy"),
    ).toContain("nonce-");
  });

  it("aplica headers al redirect de una ruta admin sin sesion", async () => {
    const { proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://studioflow.test/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://studioflow.test/login?next=%2Fadmin",
    );
    expectSecurityHeaders(response);
  });

  it.each(["/admin", "/member"])(
    "aplica headers y revalida la sesion en %s",
    async (pathname) => {
      const { proxy } = await import("@/proxy");
      const request = new NextRequest(`https://studioflow.test${pathname}`, {
        headers: { cookie: "sb-project-auth-token=session" },
      });

      const response = await proxy(request);

      expect(updateSession).toHaveBeenCalled();
      expectSecurityHeaders(response);
      expect(
        response.headers.get("x-middleware-request-content-security-policy"),
      ).toContain("nonce-");
    },
  );

  it("cubre paginas y excluye assets y prefetch", async () => {
    const { config } = await import("@/proxy");

    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/login" }),
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/admin" }),
    ).toBe(true);

    for (const url of [
      "/_next/static/chunk.js",
      "/_next/image?url=%2Flogo.png",
      "/favicon.ico",
    ]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
    }

    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/member",
        headers: { "next-router-prefetch": "1" },
      }),
    ).toBe(false);
  });
});
