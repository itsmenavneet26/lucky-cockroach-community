import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: require.resolve("./tests/global-setup.ts"),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Dev-mode flake mitigation: Next compiles routes on first hit, so an
  // axe scan run against a route that hasn't finished hydrating can return
  // false-positive violations. One retry buys a warmed-up second pass.
  // CI should run against `next start` (prod build) with retries: 0.
  retries: process.env.CI ? 0 : 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Test against `next start` (production build), not `next dev`.
    // - `next dev` compiles each route on first hit → false-positive a11y
    //   failures when axe scans a partially-hydrated DOM.
    // - `next start` runs the same compiled bundle real users get.
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
