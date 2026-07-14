import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Railway config as code", () => {
  it("configura el web service con standalone y readiness", async () => {
    const [nextConfig, packageJson, railwayConfig] = await Promise.all([
      readFile("next.config.ts", "utf8"),
      readFile("package.json", "utf8").then(JSON.parse),
      readFile("railway.toml", "utf8"),
    ]);

    expect(nextConfig).toContain('output: "standalone"');
    expect(packageJson.scripts.start).toBe("node .next/standalone/server.js");
    expect(railwayConfig).toContain('builder = "RAILPACK"');
    expect(railwayConfig).toContain('healthcheckPath = "/api/health/ready"');
    expect(railwayConfig).toContain("healthcheckTimeout = 300");
  });

  it("configura el cron diario como proceso que no reinicia", async () => {
    const cronConfig = await readFile("railway.cron.toml", "utf8");

    expect(cronConfig).toContain(
      'buildCommand = "node --check scripts/run-notifications-cron.mjs"',
    );
    expect(cronConfig).toContain(
      'startCommand = "node scripts/run-notifications-cron.mjs"',
    );
    expect(cronConfig).toContain('cronSchedule = "0 12 * * *"');
    expect(cronConfig).toContain('restartPolicyType = "NEVER"');
  });
});
