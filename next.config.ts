import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost ?? "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    // Content Security Policy — defense-in-depth against XSS (the JSON-LD
    // sink was already patched). Allowing `unsafe-inline` for scripts is a
    // necessary concession to Next.js's inline hydration data and our
    // theme-init script in <head>. Tighten further later by switching to
    // strict-dynamic + per-request nonces if we host scripts elsewhere.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${supabaseHost ? `https://${supabaseHost} wss://${supabaseHost}` : "https://*.supabase.co wss://*.supabase.co"} https://vitals.vercel-insights.com`,
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      // `upgrade-insecure-requests` would break local Playwright runs by
      // forcing http://localhost → https://localhost. HSTS already enforces
      // HTTPS for the real domain, so this directive is redundant in prod.
    ].join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    return [
      // Site-wide security headers.
      { source: "/:path*", headers: securityHeaders },

      // Marketing / evergreen content — safe to cache aggressively. Anonymous
      // visitors hit this from the edge in ~20 ms; the proxy short-circuits
      // session refresh so no Set-Cookie ruins the cache key.
      {
        source: "/:path(|about|guidelines|mental-health|scholarship|volunteer)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },

      // Content lists that change often but tolerate slight staleness.
      {
        source: "/:path(explore|leaderboard)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },

      // Public profile / topic / post detail pages.
      {
        source: "/:path(t|u|post)/:slug*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },

      // Static assets we serve from /public — long-lived, immutable.
      {
        source: "/:asset(robots.txt|sitemap.xml|llms.txt|favicon.ico|onboarding.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
