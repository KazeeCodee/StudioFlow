import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({ redirect }));

describe("loginAction", () => {
  it("no refleja un next externo en el redirect de error", async () => {
    const { loginAction } = await import("@/app/(auth)/actions");
    const formData = new FormData();
    formData.set("next", "https://evil.example/phishing");

    await expect(loginAction(formData)).rejects.toThrow(
      "REDIRECT:/login?error=missing_credentials",
    );
  });
});
