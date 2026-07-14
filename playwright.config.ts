import { defineConfig, devices } from "@playwright/test";
import { loadE2EEnvironment } from "./tests/e2e/support/e2e-env";

const e2eEnvironment = loadE2EEnvironment();
const baseURL = e2eEnvironment.values.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 3000",
    env: e2eEnvironment.values,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
