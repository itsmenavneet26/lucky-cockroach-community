/**
 * Centralised environment access.
 *
 * Public (NEXT_PUBLIC_*) vars are inlined at build time, so they're safe
 * to read directly. Server-only vars are read lazily so that a missing
 * value throws at the call site (with a clear message) rather than
 * deep inside a Supabase call.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local (see .env.example).`,
    );
  }
  return value;
}

export const PUBLIC_ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export function requirePublicSupabase() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", PUBLIC_ENV.SUPABASE_URL),
    anonKey: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      PUBLIC_ENV.SUPABASE_ANON_KEY,
    ),
  };
}

export function requireServiceRoleKey() {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** True when the minimum Supabase env vars are present. */
export function isSupabaseConfigured() {
  return Boolean(PUBLIC_ENV.SUPABASE_URL && PUBLIC_ENV.SUPABASE_ANON_KEY);
}
