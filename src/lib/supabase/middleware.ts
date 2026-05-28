import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, PUBLIC_ENV } from "@/lib/env";

const PROTECTED = [
  "/submit",
  "/settings",
  "/notifications",
  "/saved",
  "/onboarding",
  "/admin",
];

const AUTH_ONLY = ["/login", "/signup", "/forgot-password"];

/**
 * Public-content paths that should be cacheable at the edge for anonymous
 * visitors. These routes also need to skip Supabase auth refresh when no
 * `sb-*` auth cookie is present — otherwise the response would carry a
 * Set-Cookie header and Vercel's edge cache treats it as private.
 */
const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/explore",
  "/guidelines",
  "/leaderboard",
  "/mental-health",
  "/scholarship",
  "/volunteer",
]);

const PUBLIC_PREFIXES = ["/t/", "/u/", "/post/"];

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path.startsWith(p));
}

function hasAuthCookie(request: NextRequest): boolean {
  // Supabase stores its session in cookies named `sb-<projectRef>-auth-token`.
  // We don't need to know the project ref — any cookie that starts with `sb-`
  // and looks like an auth token is enough to opt into the auth refresh path.
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) return true;
  }
  return false;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase not configured yet — skip auth so the app still previews.
  if (!isSupabaseConfigured()) return response;

  // Fast path: anonymous user on a public-content route → never touch auth
  // cookies, so the response stays cacheable at Vercel's edge.
  const path = request.nextUrl.pathname;
  if (isPublicPath(path) && !hasAuthCookie(request)) {
    return response;
  }

  const supabase = createServerClient(
    PUBLIC_ENV.SUPABASE_URL!,
    PUBLIC_ENV.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Local JWT verification (asymmetric ECC key) — no GoTrue round-trip per
  // request. WebCrypto is available in the edge runtime; the JWKS is cached.
  const { data: claims, error } = await supabase.auth.getClaims();
  const user = claims?.claims?.sub ? { id: claims.claims.sub } : null;

  // Auth errors here are usually expired/invalid sessions — Supabase will
  // already have cleared the cookies via setAll above. Treat as signed-out.
  if (error && process.env.NODE_ENV !== "production") {
    console.warn("[middleware] getClaims error:", error.message);
  }

  const needsAuth = PROTECTED.some(
    (p) => path === p || path.startsWith(p + "/"),
  );
  const isAuthPage = AUTH_ONLY.some((p) => path === p);
  const isAdminPath = path === "/admin" || path.startsWith("/admin/");

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Defence in depth: enforce admin role at the edge, not only in the
  // layout RSC. Layout still re-checks before rendering sensitive data.
  if (isAdminPath && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Signed-in users hitting login/signup go home (or to ?next=).
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get("next") || "/";
    // Strict same-origin redirect: must start with a single "/" and not
    // be a protocol-relative "//host" or contain a scheme.
    const safe =
      next.startsWith("/") &&
      !next.startsWith("//") &&
      !next.startsWith("/\\") &&
      !/^\/[^/]*:/.test(next);
    const url = request.nextUrl.clone();
    url.pathname = safe ? next.split("?")[0] : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
