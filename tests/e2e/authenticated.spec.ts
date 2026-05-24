import { test, expect } from "./fixtures";

/**
 * Authenticated user-flow tests. These exercise server-action paths that
 * unauthenticated tests skip: vote, save, comment, settings update.
 *
 * Run with:
 *   PW_TEST_EMAIL=… PW_TEST_PASSWORD=… npx playwright test authenticated
 *
 * Without env vars set, every test in this file auto-skips.
 */
test.describe("authenticated user flows @critical", () => {
  test("can upvote any other user's post without error toast", async ({ signedInPage: page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});

    // Pick the first upvote button that isn't the user's own post — we
    // detect "own" by checking that clicking shows the self-vote error;
    // if so, try the next post.
    const upvotes = page.getByRole("button", { name: /upvote/i });
    const count = await upvotes.count();
    test.skip(count === 0, "No posts in feed to vote on.");

    for (let i = 0; i < Math.min(count, 5); i++) {
      const btn = upvotes.nth(i);
      await btn.scrollIntoViewIfNeeded();
      await btn.click();

      const errorToast = page.getByRole("alert").filter({ hasText: /didn't work|on our end|ref:/i });
      const ownContent = page.getByRole("alert").filter({ hasText: /own content/i });

      // If we vote on our own post the app must say so cleanly — NOT show
      // the generic "didn't work" toast.
      if (await ownContent.first().isVisible({ timeout: 1500 }).catch(() => false)) continue;

      // Wait briefly; assert no generic-error toast appeared.
      await expect(errorToast).toHaveCount(0, { timeout: 2500 });
      return;
    }
    test.fail(true, "Every post in the feed appears to be the test user's own.");
  });

  test("settings page renders user's saved profile fields", async ({ signedInPage: page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });
});
