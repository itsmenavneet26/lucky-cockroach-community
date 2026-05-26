import { test, expect } from "@playwright/test";

const PAGES = ["/", "/about", "/explore", "/leaderboard", "/guidelines"];

test.describe("SEO meta tags", () => {
  for (const path of PAGES) {
    test(`${path} has canonical, og:title, og:description, viewport`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, `canonical on ${path}`).toBeTruthy();

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
      expect(ogTitle, `og:title on ${path}`).toBeTruthy();

      const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
      expect(ogDesc, `og:description on ${path}`).toBeTruthy();

      const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
      expect(viewport).toMatch(/width=device-width/);
    });
  }
});

test.describe("robots & sitemap", () => {
  test("/robots.txt is served and references sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.toLowerCase()).toContain("user-agent");
  });

  test("/sitemap.xml is served and well-formed", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("</urlset>");
  });
});
