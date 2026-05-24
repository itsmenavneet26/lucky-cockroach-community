import { test, expect } from "@playwright/test";

test.describe("security headers @critical", () => {
  test("home response has hardened security headers", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toContain("strict-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["strict-transport-security"]).toContain("max-age=");
  });
});

test.describe("xss reflection", () => {
  test("search query is not reflected as HTML", async ({ page }) => {
    const payload = '"><script>window.__pwned=true</script>';
    await page.goto(`/search?q=${encodeURIComponent(payload)}`);
    const pwned = await page.evaluate(() => (window as unknown as { __pwned?: boolean }).__pwned === true);
    expect(pwned, "script payload must not execute via search query").toBe(false);
  });

  test("username path segment is not reflected as HTML", async ({ page }) => {
    const payload = '<img src=x onerror=window.__pwned2=true>';
    await page.goto(`/u/${encodeURIComponent(payload)}`);
    const pwned = await page.evaluate(() => (window as unknown as { __pwned2?: boolean }).__pwned2 === true);
    expect(pwned).toBe(false);
  });
});

test.describe("auth", () => {
  test("session cookie absent before sign-in", async ({ context, page }) => {
    await page.goto("/");
    const cookies = await context.cookies();
    const supabaseCookie = cookies.find((c) => c.name.startsWith("sb-"));
    if (supabaseCookie) {
      expect(supabaseCookie.httpOnly, "Supabase session cookie must be httpOnly").toBe(true);
    }
  });
});
