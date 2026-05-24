import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = ["/", "/login", "/about", "/explore", "/leaderboard"];

test.use({ colorScheme: "dark" });

for (const path of ROUTES) {
  test(`dark mode a11y: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    // Force the .dark class if app uses class-based theming
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    if (results.violations.length) {
      for (const v of results.violations) {
        console.log(`  [${v.impact}] ${v.id} (${v.nodes.length})`);
      }
    }
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
}
