import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, unauthenticated, type ActionFailure } from "@/lib/errors";
import type { Profile } from "@/lib/types";

/** The signed-in user's auth record, or null. Cached per request. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    // Expired/invalid sessions surface here as AuthSessionMissingError;
    // that's expected for signed-out visitors, so don't log it.
    if (error.name !== "AuthSessionMissingError") {
      console.warn("[auth] getUser:", error.message);
    }
    return null;
  }
  return data.user;
});

/** The signed-in user's profile row, or null. Cached per request. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[auth] getProfile:", error.message);
    return null;
  }
  return (data as Profile | null) ?? null;
});

/** Redirect to /login if signed out. Returns the user otherwise. */
export async function requireUser(next?: string) {
  const user = await getUser();
  if (!user) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }
  return user;
}

/**
 * Verify the caller has a live, non-banned session before letting them
 * perform any mutating action. Returns `{ user, profile }` on success or
 * an `ActionFailure` the action can return directly. This is the single
 * choke-point that enforces mid-session bans — banning a user takes
 * effect on their next action, not only on their next page load.
 */
export async function requireActiveUser(): Promise<
  | { ok: true; user: { id: string }; profile: Profile }
  | { ok: false; failure: ActionFailure }
> {
  const user = await getUser();
  if (!user) return { ok: false, failure: unauthenticated() };
  const profile = await getProfile();
  if (!profile) return { ok: false, failure: unauthenticated() };
  if (profile.is_banned) {
    return {
      ok: false,
      failure: fail(
        "forbidden",
        "Your account has been suspended. Contact support if you think this is a mistake.",
      ),
    };
  }
  return { ok: true, user: { id: user.id }, profile };
}

/** Redirect to /login if signed out, /onboarding if not onboarded. */
export async function requireOnboardedProfile(next?: string): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }
  if (!profile.onboarded) {
    redirect(
      `/onboarding${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    );
  }
  return profile;
}
