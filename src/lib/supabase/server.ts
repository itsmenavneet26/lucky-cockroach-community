import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requirePublicSupabase, requireServiceRoleKey } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = requirePublicSupabase();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — session refresh is handled
          // by middleware, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS. Use only in trusted server code
 * (admin actions, system triggers). Never expose to the browser.
 */
export function createServiceClient() {
  const { url } = requirePublicSupabase();
  const serviceKey = requireServiceRoleKey();
  return createServerClient(url, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
