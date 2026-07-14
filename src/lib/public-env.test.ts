import { describe, expect, it } from "vitest";
import { publicEnvSchema } from "@/lib/public-env";

describe("publicEnvSchema", () => {
  it("solo requiere las variables publicas de Supabase", () => {
    expect(
      publicEnvSchema.parse({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });
  });
});
