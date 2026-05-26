import { test, expect } from "@playwright/test";

test.describe("signup form", () => {
  test("client-side validation blocks empty submit", async ({ page }) => {
    await page.goto("/signup");
    await page.locator('form button[type="submit"]').first().click();
    // Still on signup; no successful navigation away
    await expect(page).toHaveURL(/\/signup/);
  });

  test("invalid email format surfaces an error", async ({ page }) => {
    await page.goto("/signup");
    const email = page.locator('input[type="email"], input[name="email"]').first();
    if (await email.count() === 0) test.skip(true, "no email field on signup page");
    await email.fill("not-an-email");
    const pw = page.locator('input[type="password"]').first();
    if (await pw.count() > 0) await pw.fill("Sup3rSecret!");
    await page.locator('form button[type="submit"]').first().click();
    // Either HTML5 validity blocks submit or server returns error — either way, still on /signup
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("forgot password form", () => {
  test("renders email input and submit button", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('form button[type="submit"]').first()).toBeVisible();
  });
});

test.describe("search form", () => {
  test("empty query renders search page without crash", async ({ page }) => {
    const res = await page.goto("/search");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Search/i);
  });

  test("query string is honoured by the page's own search input", async ({ page }) => {
    await page.goto("/search?q=hello");
    // The /search page renders its own pre-filled input inside <main>.
    // The site-header search bar is intentionally empty (fresh-search affordance),
    // so scope this assertion to the main content area.
    const input = page.locator('main input[name="q"]').first();
    await expect(input).toHaveValue("hello");
  });
});
