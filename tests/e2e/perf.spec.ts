import { test, expect } from "@playwright/test";

// Dev-mode budgets (Next.js dev does fresh SSR per route). Run against
// `next start` (production) for stricter Core Web Vitals budgets.
const BUDGETS = {
  ttfb_ms: 4000,
  fcp_ms: 6000,
  totalKB: 8000,
  jsKB: 6000,
};

const ROUTES = ["/", "/about", "/explore", "/login", "/leaderboard"];

for (const path of ROUTES) {
  test(`perf budget: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paints = performance.getEntriesByType("paint");
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const totalBytes = resources.reduce((s, r) => s + (r.transferSize || 0), 0);
      const js = resources
        .filter((r) => r.name.endsWith(".js"))
        .reduce((s, r) => s + (r.transferSize || 0), 0);
      return {
        ttfb_ms: nav?.responseStart ?? 0,
        fcp_ms: paints.find((p) => p.name === "first-contentful-paint")?.startTime ?? 0,
        totalKB: totalBytes / 1024,
        jsKB: js / 1024,
      };
    });
    console.log(`[perf] ${path}`, metrics);
    expect(metrics.ttfb_ms, `TTFB on ${path}`).toBeLessThan(BUDGETS.ttfb_ms);
    expect(metrics.fcp_ms, `FCP on ${path}`).toBeLessThan(BUDGETS.fcp_ms);
    expect(metrics.totalKB, `total bytes on ${path}`).toBeLessThan(BUDGETS.totalKB);
    expect(metrics.jsKB, `JS bytes on ${path}`).toBeLessThan(BUDGETS.jsKB);
  });
}
