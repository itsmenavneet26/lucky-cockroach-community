"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { fromZod, mapDbError, type FieldErrors } from "@/lib/errors";

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_]+$/);

/** Live availability check for the onboarding form. */
export async function checkUsername(
  raw: string,
): Promise<{ ok: boolean; available?: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "Please sign in to check username availability." };
  }
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "3-20 lowercase letters, numbers, underscores." };
  }
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("id")
    .eq("username", parsed.data)
    .maybeSingle();
  if (error) {
    console.error("[onboarding] checkUsername:", error.message);
    return { ok: false, error: "Could not check that username right now." };
  }
  const available = !data || data.id === user?.id;
  return { ok: true, available };
}

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be at most 20 characters.")
    .regex(/^[a-z0-9_]+$/, "Use only lowercase letters, numbers, and underscores."),
  displayName: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(300).optional(),
  pronouns: z.string().trim().max(30).optional(),
  location: z.string().trim().max(80).optional(),
  status: z.string().trim().max(40).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
  next: z.string().optional(),
});

export type OnboardingState = {
  error?: string;
  fieldErrors?: FieldErrors;
};

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // FormData.get returns null for missing fields; Zod's .optional() only
  // accepts `undefined`, so coerce null → undefined for every optional input.
  const opt = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? undefined : v;
  };
  const parsed = schema.safeParse({
    username: formData.get("username"),
    displayName: opt("displayName"),
    bio: opt("bio"),
    pronouns: opt("pronouns"),
    location: opt("location"),
    status: opt("status"),
    interests: formData.getAll("interests").map(String),
    avatarUrl: formData.get("avatarUrl") || "",
    next: opt("next"),
  });
  if (!parsed.success) {
    const f = fromZod(parsed.error);
    return { error: f.error, fieldErrors: f.fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const {
    username,
    displayName,
    bio,
    pronouns,
    location,
    status,
    interests,
    avatarUrl,
  } = parsed.data;

  const { data: taken, error: takenErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (takenErr) {
    const mapped = mapDbError("onboarding.usernameLookup", takenErr);
    return { error: mapped.error };
  }
  if (taken) {
    return {
      error: "That username is already taken.",
      fieldErrors: { username: "Already taken." },
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || username,
      bio: bio || null,
      pronouns: pronouns || null,
      location: location || null,
      status: status || null,
      interests,
      avatar_url: avatarUrl || null,
      onboarded: true,
    })
    .eq("id", user.id);

  if (error) {
    const mapped = mapDbError("onboarding.update", error, {
      "23505": { code: "conflict", message: "That username is already taken." },
    });
    return {
      error: mapped.error,
      fieldErrors:
        mapped.code === "conflict"
          ? { username: "Already taken." }
          : undefined,
    };
  }

  redirect(parsed.data.next || "/");
}
