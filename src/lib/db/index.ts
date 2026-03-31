import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { getEnv } from "@/lib/env";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getClient() {
  if (client) {
    return client;
  }

  client = postgres(getEnv().DATABASE_URL, {
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
