import { test, expect, devices } from "@playwright/test";

test.use({ ...devices["iPhone 13"] });

test.describe("mobile viewport @smoke", () => {
  test("home renders without horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(overflow.scroll, "no horizontal overflow").toBeLessThanOrEqual(overflow.client + 1);
  });

  test("mobile menu button is reachable and meets target size", async ({ page }) => {
    await page.goto("/");
    const opener = page.getByRole("button", { name: /open menu/i });
    await expect(opener).toBeVisible();
    const box = await opener.boundingBox();
    expect(box, "menu button must have a bounding box").not.toBeNull();
    if (box) {
      // WCAG 2.5.8 minimum target size 24×24; we recommend 44×44.
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
  });

  test("login form is usable on mobile", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="identifier"], input[type="email"]').first().fill("a@b.co");
    await page.locator('input[type="password"]').fill("xxxxx");
    // Submit button should be visible above the fold or reachable by scroll.
    const submit = page.locator('form button[type="submit"]').first();
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeVisible();
  });
});
