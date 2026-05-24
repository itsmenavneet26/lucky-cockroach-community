/**
 * Thin wrapper around the `check_action_rate` SQL RPC.
 *
 * Pass the action name + key (user id, email, IP — whatever scopes the
 * limit) and the limit/window. Returns true when allowed, false when
 * the limit has been exceeded. Errors are treated as "allowed" so a
 * temporary DB blip cannot lock everyone out of signup.
 */

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export async function checkRate(
  key: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { data, error } = await service.rpc("check_action_rate", {
      p_key: key.toLowerCase(),
      p_action: action,
      p_limit: limit,
      p_window_s: windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] rpc:", action, error.message);
      return true;
    }
    return data !== false;
  } catch (err) {
    console.error("[rate-limit] threw:", action, err);
    return true;
  }
}

/** Best-effort client IP — Vercel, Cloudflare, and most proxies set
 *  `x-forwarded-for`. Falls back to a stable "unknown" bucket so we
 *  still rate-limit anonymous traffic in aggregate. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") || "unknown";
}
