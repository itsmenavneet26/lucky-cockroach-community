import { test, expect } from "@playwright/test";

const ROUTES = ["/", "/about", "/explore", "/login", "/leaderboard", "/guidelines"];

for (const path of ROUTES) {
  test(`landmarks: ${path} has banner + main`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    // Banner / header
    await expect(page.locator("header, [role=banner]")).toHaveCount(1, { timeout: 5000 });
    // Main content region
    const mainCount = await page.locator("main, [role=main]").count();
    expect(mainCount, `${path} must have a <main> landmark`).toBeGreaterThanOrEqual(1);
  });
}

test("forms have associated labels", async ({ page }) => {
  await page.goto("/login");
  const inputs = await page.locator("form input:not([type=hidden])").all();
  expect(inputs.length).toBeGreaterThan(0);
  for (const input of inputs) {
    const id = await input.getAttribute("id");
    const ariaLabel = await input.getAttribute("aria-label");
    const ariaLabelledBy = await input.getAttribute("aria-labelledby");
    const wrappedLabel = await input.evaluate((el) => !!el.closest("label"));
    const hasLabelFor = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false;
    const labelled = !!ariaLabel || !!ariaLabelledBy || wrappedLabel || hasLabelFor;
    expect(labelled, `input ${await input.getAttribute("name")} must have a label`).toBe(true);
  }
});

test("page has exactly one <h1> on /about", async ({ page }) => {
  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveCount(1);
});
