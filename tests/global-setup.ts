import { request } from "@playwright/test";

/**
 * Warm Next.js dev compiler before any test runs.
 *
 * Next.js dev compiles each route on first hit. Without this warm-up,
 * the first axe scan / form interaction can race the compiler and see
 * a partially hydrated DOM, producing false-positive failures.
 *
 * One round-trip per route is enough — Next caches the compiled output
 * for the rest of the test run.
 */
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
  "/search",
  "/forgot-password",
  "/reset-password",
  "/dashboard",
  "/u/test",
  "/t/test",
  "/post/nonexistent-warmup",
];

export default async function globalSetup() {
  const ctx = await request.newContext({ baseURL: "http://localhost:3000" });
  // Fire all warm-up requests in parallel — Next handles concurrent compiles.
  await Promise.allSettled(
    ROUTES.map((r) => ctx.get(r, { timeout: 60_000 }).catch(() => null)),
  );
  await ctx.dispose();
}
