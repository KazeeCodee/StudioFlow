import { z } from "zod";

const redisUrlSchema = z
  .string()
  .min(1)
  .refine((value) => {
    try {
      return ["redis:", "rediss:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "REDIS_URL debe usar redis:// o rediss://.");

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    DATABASE_URL: z.string().min(1),
    APP_URL: z.url().optional(),
    CRON_SECRET: z.string().min(1).optional(),
    REDIS_URL: redisUrlSchema.optional(),
    EMAIL_TRANSPORT_MODE: z.enum(["log", "resend"]).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
  })
  .superRefine((env, context) => {
    if (env.APP_URL) {
      const appUrl = new URL(env.APP_URL);
      const isLocalDevelopment =
        env.NODE_ENV !== "production" &&
        appUrl.protocol === "http:" &&
        ["localhost", "127.0.0.1", "::1"].includes(appUrl.hostname);

      if (appUrl.protocol !== "https:" && !isLocalDevelopment) {
        context.addIssue({
          code: "custom",
          path: ["APP_URL"],
          message: "APP_URL debe usar HTTPS salvo en desarrollo local.",
        });
      }
    }

    if (env.NODE_ENV !== "production") {
      return;
    }

    for (const key of [
      "APP_URL",
      "CRON_SECRET",
      "REDIS_URL",
      "EMAIL_TRANSPORT_MODE",
    ] as const) {
      if (!env[key]) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} es obligatoria en produccion.`,
        });
      }
    }

    if (env.EMAIL_TRANSPORT_MODE === "resend") {
      for (const key of ["EMAIL_FROM", "RESEND_API_KEY"] as const) {
        if (!env[key]) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: `${key} es obligatoria cuando Resend esta habilitado.`,
          });
        }
      }
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    EMAIL_TRANSPORT_MODE: process.env.EMAIL_TRANSPORT_MODE,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });

  return cachedEnv;
}
