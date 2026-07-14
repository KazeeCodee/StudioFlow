import { describe, expect, it } from "vitest";
import {
  buildRateLimitKey,
  getTrustedClientIp,
  normalizeAccountIdentifier,
} from "@/lib/request-identity";

describe("request identity", () => {
  it("normaliza la cuenta y acepta X-Real-IP solo desde Railway", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.24" });

    expect(normalizeAccountIdentifier("  USER@Example.COM ")).toBe(
      "user@example.com",
    );
    expect(getTrustedClientIp(headers, true)).toBe("198.51.100.24");
    expect(getTrustedClientIp(headers, false)).toBe("unknown");
  });

  it("genera claves sin identificadores en claro", () => {
    const key = buildRateLimitKey("login", [
      "198.51.100.24",
      "user@example.com",
    ]);

    expect(key).toMatch(/^rate-limit:login:[a-f0-9]{64}$/);
    expect(key).not.toContain("198.51.100.24");
    expect(key).not.toContain("user@example.com");
  });
});
