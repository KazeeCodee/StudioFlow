import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadE2EEnvironment,
  validateE2EEnvironment,
} from "../e2e/support/e2e-env";

const stagingRef = "abcdefghijklmnopqrst";
const productionRef = "zyxwvutsrqponmlkjihg";
const temporaryDirectories: string[] = [];

function validEnvironment() {
  return {
    E2E_ALLOW_MUTATIONS: "true",
    E2E_EXPECTED_SUPABASE_PROJECT_REF: stagingRef,
    E2E_PRODUCTION_SUPABASE_PROJECT_REF: productionRef,
    NEXT_PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "staging-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "staging-service-key",
    DATABASE_URL: `postgresql://postgres.${stagingRef}:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("validateE2EEnvironment", () => {
  it("acepta solamente Auth y SQL del proyecto staging esperado", () => {
    expect(validateE2EEnvironment(validEnvironment())).toEqual(
      expect.objectContaining({
        E2E_EXPECTED_SUPABASE_PROJECT_REF: stagingRef,
        NEXT_PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co`,
      }),
    );
  });

  it("rechaza mutaciones sin opt-in explicito", () => {
    expect(() =>
      validateE2EEnvironment({
        ...validEnvironment(),
        E2E_ALLOW_MUTATIONS: "false",
      }),
    ).toThrow("E2E_ALLOW_MUTATIONS=true");
  });

  it("rechaza el project ref de produccion", () => {
    expect(() =>
      validateE2EEnvironment({
        ...validEnvironment(),
        E2E_EXPECTED_SUPABASE_PROJECT_REF: productionRef,
        NEXT_PUBLIC_SUPABASE_URL: `https://${productionRef}.supabase.co`,
        DATABASE_URL: `postgresql://postgres.${productionRef}:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
      }),
    ).toThrow("production");
  });

  it("rechaza una DATABASE_URL de otro proyecto", () => {
    expect(() =>
      validateE2EEnvironment({
        ...validEnvironment(),
        DATABASE_URL:
          "postgresql://postgres.otherprojectref:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
      }),
    ).toThrow("DATABASE_URL");
  });
});

describe("loadE2EEnvironment", () => {
  it("lee .env.e2e.local y nunca cae en .env.local", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "studioflow-e2e-env-"));
    temporaryDirectories.push(directory);
    const stagingEnvironment = validEnvironment();
    await writeFile(
      path.join(directory, ".env.e2e.local"),
      Object.entries(stagingEnvironment)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n"),
    );
    await writeFile(
      path.join(directory, ".env.local"),
      `NEXT_PUBLIC_SUPABASE_URL=https://${productionRef}.supabase.co`,
    );

    const loaded = loadE2EEnvironment({ cwd: directory, processEnv: {} });

    expect(loaded.NEXT_PUBLIC_SUPABASE_URL).toBe(
      `https://${stagingRef}.supabase.co`,
    );
  });
});
