import { describe, expect, it } from "vitest";
import { getSafeInternalPath } from "@/lib/safe-redirect";

describe("getSafeInternalPath", () => {
  it.each([
    "https://evil.example/phishing",
    "//evil.example/phishing",
    "/\\evil.example/phishing",
    "/member/bookings\nSet-Cookie: attack=1",
    "/member/%0d%0aattack",
    "/api/cron/notifications",
    "/unknown/path",
  ])("rechaza destinos no internos o fuera de allowlist: %s", (value) => {
    expect(getSafeInternalPath(value, "/member")).toBe("/member");
  });

  it("conserva path, query y hash de un destino interno permitido", () => {
    expect(
      getSafeInternalPath(
        "/member/bookings?status=confirmed#next",
        "/member",
      ),
    ).toBe("/member/bookings?status=confirmed#next");
  });
});
