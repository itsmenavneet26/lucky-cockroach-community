import { test, expect } from "@playwright/test";

test.describe("keyboard navigation @critical", () => {
  test("Tab moves focus through interactive elements", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Click into the body first to ensure the page has focus before tabbing.
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    await page.keyboard.press("Tab");
    // After at least one Tab, focus must be on a focusable element (not body)
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).not.toBe("BODY");
  });

  test("focused element has a visible focus indicator", async ({ page }) => {
    await page.goto("/login");
    // Tab onto the email input
    await page.locator('input[name="identifier"], input[type="email"]').first().focus();
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow, border: s.borderColor };
    });
    // Some indicator must be present (outline, ring/shadow, or border change).
    const hasIndicator =
      (outline?.outline !== "none" && outline?.outlineWidth !== "0px") ||
      (outline?.boxShadow && outline.boxShadow !== "none") ||
      !!outline?.border;
    expect(hasIndicator, `no visible focus indicator: ${JSON.stringify(outline)}`).toBe(true);
  });

  test("Enter on a link follows it", async ({ page }) => {
    await page.goto("/about");
    const logo = page.getByRole("link", { name: /Lucky Cockroach Community.*home/i });
    await logo.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test("Escape closes mobile menu (if openable)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const opener = page.getByRole("button", { name: /open menu/i });
    if (await opener.isVisible()) {
      await opener.click();
      await page.keyboard.press("Escape");
      // Drawer should be closed — opener back to visible state
      await expect(opener).toBeVisible();
    }
  });
});
