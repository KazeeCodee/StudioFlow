import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/env";

describe("envSchema", () => {
  it("acepta las variables mínimas requeridas", () => {
    const result = envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
    });

    expect(result.NEXT_PUBLIC_SUPABASE_URL).toContain("supabase.co");
  });
});
