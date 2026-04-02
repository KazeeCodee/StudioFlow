import { setDefaultResultOrder } from "node:dns";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { getEnv } from "@/lib/env";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Railway can resolve Supabase hosts to IPv6 first; prefer IPv4 to avoid ENETUNREACH
// in environments without outbound IPv6 support.
setDefaultResultOrder("ipv4first");

function getDatabasePoolMax() {
  const configuredMax = Number(process.env.DATABASE_POOL_MAX);

  if (Number.isFinite(configuredMax) && configuredMax > 0) {
    return configuredMax;
  }

  return process.env.NODE_ENV === "production" ? 10 : 1;
}

function getClient() {
  if (client) {
    return client;
  }

  client = postgres(getEnv().DATABASE_URL, {
    max: getDatabasePoolMax(),
    prepare: false,
  });

  return client;
}

export function getDb() {
  if (db) {
    return db;
  }

  db = drizzle(getClient(), { schema });
  return db;
}

export { schema };
