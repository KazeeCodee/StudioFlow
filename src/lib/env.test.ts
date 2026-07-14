import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/env";

describe("envSchema", () => {
  const minimumEnv = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    DATABASE_URL: "postgres://user:pass@localhost:5432/db",
  };

  it("acepta las variables minimas requeridas", () => {
    const result = envSchema.parse(minimumEnv);

    expect(result.NEXT_PUBLIC_SUPABASE_URL).toContain("supabase.co");
  });

  it("exige origen HTTPS y secretos operativos en produccion", () => {
    const result = envSchema.safeParse({
      ...minimumEnv,
      NODE_ENV: "production",
      APP_URL: "http://studioflow.example",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["APP_URL", "CRON_SECRET", "REDIS_URL"]),
      );
    }
  });

  it("exige remitente y API key cuando Resend esta habilitado", () => {
    const result = envSchema.safeParse({
      ...minimumEnv,
      NODE_ENV: "production",
      APP_URL: "https://studioflow.example",
      CRON_SECRET: "cron-secret",
      REDIS_URL: "rediss://default:password@redis.example:6379",
      EMAIL_TRANSPORT_MODE: "resend",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["EMAIL_FROM", "RESEND_API_KEY"]),
      );
    }
  });

  it("exige elegir explicitamente el transporte de email en produccion", () => {
    const result = envSchema.safeParse({
      ...minimumEnv,
      NODE_ENV: "production",
      APP_URL: "https://studioflow.example",
      CRON_SECRET: "cron-secret",
      REDIS_URL: "rediss://default:password@redis.example:6379",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toContain(
        "EMAIL_TRANSPORT_MODE",
      );
    }
  });

  it("permite HTTP solamente para desarrollo local", () => {
    expect(
      envSchema.safeParse({
        ...minimumEnv,
        NODE_ENV: "development",
        APP_URL: "http://localhost:3000",
      }).success,
    ).toBe(true);
    expect(
      envSchema.safeParse({
        ...minimumEnv,
        NODE_ENV: "development",
        APP_URL: "http://studioflow.example",
      }).success,
    ).toBe(false);
  });
});
