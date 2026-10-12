import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests",
  timeout: 300_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${port}`, acceptDownloads: true, trace: "retain-on-failure" },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: `http://localhost:${port}/login`,
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: "pipe",
  },
});
