import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("release CI configuration", () => {
  it("ejecuta todos los gates locales con Node 20 y Supabase local", async () => {
    const [workflow, packageJson] = await Promise.all([
      readFile(".github/workflows/ci.yml", "utf8"),
      readFile("package.json", "utf8").then(JSON.parse),
    ]);

    expect(workflow).toContain("node-version: 20");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm audit --omit=dev");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm test");
    expect(workflow).toContain("supabase db start");
    expect(workflow).toContain("supabase migration list --local");
    expect(workflow).toContain("npm run test:integration");
    expect(workflow).toContain("npm run test:coverage");
    expect(workflow).toContain("npm run build");
    expect(packageJson.scripts.test).toBe("vitest run src scripts tests/unit");
  });

  it("serializa los E2E de staging y usa secretos del environment", async () => {
    const workflow = await readFile(".github/workflows/staging-e2e.yml", "utf8");

    expect(workflow).toContain("environment: staging");
    expect(workflow).toContain("group: studioflow-staging-e2e");
    expect(workflow).toContain("cancel-in-progress: true");
    expect(workflow).toContain("E2E_ALLOW_MUTATIONS: \"true\"");
    expect(workflow).toContain("secrets.STAGING_SUPABASE_PROJECT_REF");
    expect(workflow).toContain("secrets.PRODUCTION_SUPABASE_PROJECT_REF");
    expect(workflow).toContain("npm run test:e2e");
    expect(workflow).not.toContain("railway up");
  });

  it("fija los umbrales al baseline medido y documenta los gates externos", async () => {
    const [vitestConfig, readme] = await Promise.all([
      readFile("vitest.config.ts", "utf8"),
      readFile("README.md", "utf8"),
    ]);

    expect(vitestConfig).toContain("statements: 56.61");
    expect(vitestConfig).toContain("branches: 51.64");
    expect(vitestConfig).toContain("functions: 61.41");
    expect(vitestConfig).toContain("lines: 56.48");
    expect(readme).toContain("CI / quality");
    expect(readme).toContain("CI / database");
    expect(readme).toContain("Staging E2E / e2e");
    expect(readme).toContain("dos releases exitosos");
  });
});
