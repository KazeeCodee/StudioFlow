import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  getContentSecurityPolicyHeaderName,
} from "@/lib/security-headers";

describe("buildContentSecurityPolicy", () => {
  const input = {
    nonce: "nonce-value",
    supabaseUrl: "https://studioflow.supabase.co",
  };

  it("genera una politica estricta para produccion", () => {
    const policy = buildContentSecurityPolicy({
      ...input,
      isDevelopment: false,
    });

    expect(policy).toContain("script-src 'self' 'nonce-nonce-value' 'strict-dynamic'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(
      policy.split(";").find((directive) => directive.trim().startsWith("script-src")),
    ).not.toContain("'unsafe-inline'");
    expect(policy).toContain("https://studioflow.supabase.co");
    expect(policy).toContain("frame-src https://www.youtube.com");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("habilita solamente las excepciones necesarias para desarrollo", () => {
    const policy = buildContentSecurityPolicy({
      ...input,
      isDevelopment: true,
    });

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
  });
});

describe("getContentSecurityPolicyHeaderName", () => {
  it("permite report-only en staging sin cambiar la politica", () => {
    expect(getContentSecurityPolicyHeaderName(true)).toBe(
      "Content-Security-Policy-Report-Only",
    );
    expect(getContentSecurityPolicyHeaderName(false)).toBe(
      "Content-Security-Policy",
    );
  });
});
