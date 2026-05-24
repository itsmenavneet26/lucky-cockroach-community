import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  "/",
  "/about",
  "/explore",
  "/login",
  "/signup",
  "/leaderboard",
  "/guidelines",
  "/mental-health",
  "/scholarship",
  "/volunteer",
  "/search",
  "/forgot-password",
  "/reset-password",
];

for (const path of ROUTES) {
  test(`a11y: ${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    if (results.violations.length) {
      console.log(`\n--- a11y ${path} ---`);
      for (const v of results.violations) {
        console.log(`  [${v.impact}] ${v.id} (${v.nodes.length}): ${v.help}`);
        for (const n of v.nodes.slice(0, 3)) {
          console.log(`    target=${n.target.join(",")}`);
          console.log(`    html=${n.html.slice(0, 200)}`);
          if (v.id === "color-contrast" && n.any[0]?.data) {
            const d = n.any[0].data as {
              fgColor?: string;
              bgColor?: string;
              contrastRatio?: number;
              expectedContrastRatio?: string;
            };
            console.log(`    fg=${d.fgColor} bg=${d.bgColor} ratio=${d.contrastRatio} expected=${d.expectedContrastRatio}`);
          }
        }
      }
    }
    expect(
      results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
      `axe violations on ${path}`,
    ).toEqual([]);
  });
}
