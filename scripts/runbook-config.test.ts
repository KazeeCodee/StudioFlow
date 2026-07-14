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

  it("define release Railway, ensayo de staging y rollback seguro", async () => {
    const runbook = await readFile("docs/runbooks/railway-release.md", "utf8");

    expect(runbook).toContain("staging");
    expect(runbook).toContain("checkout limpio");
    expect(runbook).toContain("carga conservadora");
    expect(runbook).toContain("/api/health/ready");
    expect(runbook).toContain("rollback");
    expect(runbook).toContain("nunca revertir una migración de datos a ciegas");
    expect(runbook).toContain("24 horas");
    expect(runbook).toContain("Evidencia");
    expect(runbook).toContain("NO-GO");
  });

  it("define severidad, contención y comunicación de incidentes", async () => {
    const runbook = await readFile("docs/runbooks/incident-response.md", "utf8");

    expect(runbook).toContain("SEV-1");
    expect(runbook).toContain("Incident Commander");
    expect(runbook).toContain("contención");
    expect(runbook).toContain("Auth o secretos");
    expect(runbook).toContain("cron/email");
    expect(runbook).toContain("Postmortem");
    expect(runbook).toContain("no incluir secretos");
  });

  it("mantiene el go-live en NO-GO hasta evidenciar todos los gates", async () => {
    const checklist = await readFile("docs/checklists/production-go-live.md", "utf8");

    expect(checklist).toContain("Estado: **NO-GO**");
    expect(checklist).toContain("- [ ] Cero advisories high/critical");
    expect(checklist).toContain("- [ ] Concurrencia");
    expect(checklist).toContain("- [ ] CSP");
    expect(checklist).toContain("- [ ] Redis");
    expect(checklist).toContain("- [ ] Database y Storage restaurados");
    expect(checklist).toContain("Rollback owner");
    expect(checklist).toContain("Contactos de incidentes");
    expect(checklist).toContain("24 horas");
    expect(checklist).not.toContain("- [x]");
  });
});
