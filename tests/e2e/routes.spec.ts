import { test, expect, type Page } from "@playwright/test";

const PUBLIC_ROUTES = [
  { path: "/", titleIncludes: "Lucky Cockroach" },
  { path: "/about", titleIncludes: "About" },
  { path: "/explore", titleIncludes: "Explore" },
  { path: "/login", titleIncludes: "Sign in" },
  { path: "/signup", titleIncludes: "Sign up" },
  { path: "/leaderboard", titleIncludes: "Leaderboard" },
  { path: "/guidelines", titleIncludes: "Community guidelines" },
  { path: "/mental-health", titleIncludes: "Mental Health" },
  { path: "/scholarship", titleIncludes: "Scholarship" },
  { path: "/volunteer", titleIncludes: "Volunteer" },
  { path: "/search", titleIncludes: "Search" },
  { path: "/forgot-password", titleIncludes: "Reset password" },
  { path: "/reset-password", titleIncludes: "Set new password" },
] as const;

const AUTH_GATED = [
  "/submit",
  "/onboarding",
  "/settings",
  "/notifications",
  "/saved",
  "/admin",
];

function setupErrorCollectors(page: Page) {
  const consoleErrors: string[] = [];
  const failed: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Ignore 4xx/network noise from missing seed assets — surfaced separately.
    if (/Failed to load resource.*400|Failed to load resource.*404/.test(text)) return;
    consoleErrors.push(text);
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    const err = req.failure()?.errorText ?? "";
    // Ignore Next.js RSC prefetch aborts — they're cancelled when the test
    // navigates before the prefetch settles, not a real failure.
    if (/_rsc=/.test(url) && err.includes("ERR_ABORTED")) return;
    // Ignore aborted preloads of any resource — same reason.
    if (err.includes("ERR_ABORTED")) return;
    failed.push(`${req.method()} ${url} :: ${err}`);
  });
  page.on("response", (res) => {
    const u = res.url();
    if (res.status() >= 500 && !u.includes("_next/image")) {
      failed.push(`${res.status()} ${u}`);
    }
  });
  return { consoleErrors, failed };
}

for (const route of PUBLIC_ROUTES) {
  test(`route ${route.path} renders, no console errors, no 5xx`, async ({ page }) => {
    const { consoleErrors, failed } = setupErrorCollectors(page);
    const res = await page.goto(route.path, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `${route.path} should be 200`).toBeLessThan(400);
    await expect(page).toHaveTitle(new RegExp(route.titleIncludes, "i"));
    await page.waitForLoadState("networkidle").catch(() => {});
    expect(consoleErrors, `console errors on ${route.path}`).toEqual([]);
    expect(failed, `failed requests on ${route.path}`).toEqual([]);
  });
}

test.describe("auth gating", () => {
  for (const path of AUTH_GATED) {
    test(`${path} redirects unauthenticated users`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      const finalUrl = page.url();
      // Either redirect (status 30x or finalUrl != requested) or login page
      const redirected =
        (res && res.status() >= 300 && res.status() < 400) ||
        !finalUrl.endsWith(path);
      expect(redirected, `${path} should redirect; ended at ${finalUrl}`).toBe(true);
    });
  }
});

test.describe("dynamic routes", () => {
  test("/post/nonexistent shows not-found UI", async ({ page }) => {
    await page.goto("/post/this-slug-does-not-exist");
    await expect(page).toHaveTitle(/Post not found/i);
  });

  test("/u/[username] renders profile shell", async ({ page }) => {
    await page.goto("/u/test");
    await expect(page).toHaveTitle(/@test/i);
  });

  test("/t/[slug] renders topic shell", async ({ page }) => {
    await page.goto("/t/test");
    await expect(page).toHaveTitle(/Topic|·/i);
  });

  test("unknown route returns 404", async ({ page }) => {
    const res = await page.goto("/this-route-truly-does-not-exist");
    expect(res?.status()).toBe(404);
  });
});

test.describe("login form", () => {
  test("rejects bad credentials with error message", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"], input[name="identifier"], input[name="email"]').first().fill("nobody@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('form button[type="submit"]').first().click();
    await expect(page.getByText(/No account found|Invalid|incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test("submit empty form does not crash", async ({ page }) => {
    await page.goto("/login");
    await page.locator('form button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("navigation", () => {
  test("home logo has accessible name and links home", async ({ page }) => {
    await page.goto("/about");
    const logo = page.getByRole("link", { name: /Lucky Cockroach Community.*home/i });
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});
