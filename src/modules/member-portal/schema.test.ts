import { describe, expect, it } from "vitest";
import { memberProfileSchema } from "@/modules/member-portal/schema";

describe("memberProfileSchema", () => {
  it("reemplaza redirects externos por el perfil del miembro", () => {
    const result = memberProfileSchema.parse({
      fullName: "Member Test",
      phone: "",
      redirectTo: "//evil.example/phishing",
    });

    expect(result.redirectTo).toBe("/member/profile");
  });
});
