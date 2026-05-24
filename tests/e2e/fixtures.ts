import { test as base, expect, type Page } from "@playwright/test";

/**
 * Auth fixture — gives tests a signed-in `page`.
 *
 * Provide credentials via env vars:
 *   PW_TEST_EMAIL=you@example.com
 *   PW_TEST_PASSWORD=...
 *
 * The fixture caches the storage state across all tests in the worker, so
 * the password is only typed once. Tests that need an anonymous page can
 * still use the default `page` from "@playwright/test".
 */
export const test = base.extend<{ signedInPage: Page }>({
  signedInPage: async ({ browser }, runTest) => {
    const email = process.env.PW_TEST_EMAIL;
    const password = process.env.PW_TEST_PASSWORD;
    if (!email || !password) {
      test.skip(true, "Set PW_TEST_EMAIL + PW_TEST_PASSWORD to run authenticated tests.");
    }
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login");
    await page.locator('input[name="identifier"], input[type="email"]').first().fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('form button[type="submit"]').first().click();
    // Sign-in should redirect to "/" or to ?next=. Allow either.
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 10_000 });
    await runTest(page);
    await ctx.close();
  },
});

export { expect };
