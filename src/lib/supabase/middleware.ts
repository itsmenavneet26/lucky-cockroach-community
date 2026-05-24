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

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase not configured yet — skip auth so the app still previews.
  if (!isSupabaseConfigured()) return response;

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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Auth errors here are usually expired/invalid sessions — Supabase will
  // already have cleared the cookies via setAll above. Treat as signed-out.
  if (error && process.env.NODE_ENV !== "production") {
    console.warn("[middleware] getUser error:", error.message);
  }

  const path = request.nextUrl.pathname;
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
