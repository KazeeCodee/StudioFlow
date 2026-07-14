import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("production runbooks", () => {
  it("documenta los controles de Supabase con evidencia y estado NO-GO", async () => {
    const runbook = await readFile("docs/runbooks/supabase-production.md", "utf8");

    expect(runbook).toContain("STAGING_PROJECT_REF");
    expect(runbook).toContain("PRODUCTION_PROJECT_REF");
    expect(runbook).toContain("supabase migration list");
    expect(runbook).toContain("Security Advisor");
    expect(runbook).toContain("Performance Advisor");
    expect(runbook).toContain("Row Level Security");
    expect(runbook).toContain("service_role");
    expect(runbook).toContain("Auth");
    expect(runbook).toContain("NO-GO");
    expect(runbook).toContain("Evidencia");
  });

  it("separa backups de Database y Storage y exige un restore ensayado", async () => {
    const runbook = await readFile("docs/runbooks/backup-restore.md", "utf8");

    expect(runbook).toContain("Database");
    expect(runbook).toContain("Storage");
    expect(runbook).toContain("cifrad");
    expect(runbook).toContain("off-site");
    expect(runbook).toContain("proyecto descartable");
    expect(runbook).toContain("RPO");
    expect(runbook).toContain("RTO");
    expect(runbook).toContain("NO-GO");
    expect(runbook).toContain("Evidencia");
  });

  it("enlaza ambos runbooks desde el README", async () => {
    const readme = await readFile("README.md", "utf8");

    expect(readme).toContain("docs/runbooks/supabase-production.md");
    expect(readme).toContain("docs/runbooks/backup-restore.md");
  });
});
