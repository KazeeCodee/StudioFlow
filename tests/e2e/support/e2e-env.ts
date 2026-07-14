import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const requiredKeys = [
  "E2E_ALLOW_MUTATIONS",
  "E2E_EXPECTED_SUPABASE_PROJECT_REF",
  "E2E_PRODUCTION_SUPABASE_PROJECT_REF",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
] as const;

type RequiredKey = (typeof requiredKeys)[number];
type EnvironmentValues = Record<string, string>;

export type E2EEnvironment = Record<RequiredKey, string> & {
  values: EnvironmentValues;
};

function parseEnvironmentFile(contents: string) {
  const parsed: EnvironmentValues = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    const hasMatchingQuotes =
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")));

    if (hasMatchingQuotes) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function getSupabaseApiProjectRef(urlValue: string) {
  let url: URL;

  try {
    url = new URL(urlValue);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }

  const suffix = ".supabase.co";
  if (url.protocol !== "https:" || !url.hostname.endsWith(suffix)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be the staging Supabase URL.");
  }

  return url.hostname.slice(0, -suffix.length);
}

function getDatabaseProjectRefs(databaseUrl: string) {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL.");
  }

  const refs = new Set<string>();
  const username = decodeURIComponent(url.username);
  if (username.startsWith("postgres.")) {
    refs.add(username.slice("postgres.".length));
  }

  const directMatch = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(url.hostname);
  if (directMatch) {
    refs.add(directMatch[1]);
  }

  return refs;
}

export function validateE2EEnvironment(values: EnvironmentValues): E2EEnvironment {
  const missingKeys = requiredKeys.filter((key) => !values[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing E2E environment variables: ${missingKeys.join(", ")}.`);
  }

  if (values.E2E_ALLOW_MUTATIONS !== "true") {
    throw new Error("E2E_ALLOW_MUTATIONS=true is required for database-backed E2E.");
  }

  const expectedRef = values.E2E_EXPECTED_SUPABASE_PROJECT_REF;
  const productionRef = values.E2E_PRODUCTION_SUPABASE_PROJECT_REF;
  if (expectedRef === productionRef) {
    throw new Error("E2E staging project ref must not equal production.");
  }

  const apiRef = getSupabaseApiProjectRef(values.NEXT_PUBLIC_SUPABASE_URL);
  if (apiRef === productionRef) {
    throw new Error("E2E Supabase URL points to production.");
  }
  if (apiRef !== expectedRef) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL does not match the expected staging ref.");
  }

  const databaseRefs = getDatabaseProjectRefs(values.DATABASE_URL);
  if (databaseRefs.has(productionRef)) {
    throw new Error("E2E DATABASE_URL points to production.");
  }
  if (!databaseRefs.has(expectedRef)) {
    throw new Error("DATABASE_URL does not match the expected staging ref.");
  }

  return {
    ...(Object.fromEntries(
      requiredKeys.map((key) => [key, values[key]]),
    ) as Record<RequiredKey, string>),
    values: { ...values },
  };
}

export function loadE2EEnvironment({
  cwd = process.cwd(),
  processEnv = process.env,
}: {
  cwd?: string;
  processEnv?: NodeJS.ProcessEnv;
} = {}) {
  const envPath = path.resolve(cwd, ".env.e2e.local");
  const values = existsSync(envPath)
    ? parseEnvironmentFile(readFileSync(envPath, "utf8"))
    : {};

  for (const [key, value] of Object.entries(processEnv)) {
    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return validateE2EEnvironment(values);
}
