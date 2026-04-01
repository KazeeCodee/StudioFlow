import { z } from "zod";

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.url().optional(),
  CRON_SECRET: z.string().min(1).optional(),
  EMAIL_TRANSPORT_MODE: z.enum(["log", "resend"]).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    EMAIL_TRANSPORT_MODE: process.env.EMAIL_TRANSPORT_MODE,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });

  return cachedEnv;
}
