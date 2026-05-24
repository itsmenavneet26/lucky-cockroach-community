"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fromZod, type FieldErrors } from "@/lib/errors";

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be at most 20 characters.")
    .regex(/^[a-z0-9_]+$/, "Use only lowercase letters, numbers, and underscores."),
  displayName: z.string().trim().min(2, "Enter a display name.").max(50),
  bio: z.string().trim().max(300).optional(),
  pronouns: z.string().trim().max(30).optional(),
  location: z.string().trim().max(80).optional(),
  status: z.string().trim().max(40).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
});

export type SettingsState = {
  error?: string;
  success?: boolean;
  fieldErrors?: FieldErrors;
};

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const opt = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? undefined : v;
  };
  const parsed = schema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    bio: opt("bio"),
    pronouns: opt("pronouns"),
    location: opt("location"),
    status: opt("status"),
    interests: formData.getAll("interests").map(String),
    avatarUrl: formData.get("avatarUrl") || "",
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

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
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
      display_name: displayName,
      bio: bio || null,
      pronouns: pronouns || null,
      location: location || null,
      status: status || null,
      interests,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return {
        error: "That username is already taken.",
        fieldErrors: { username: "Already taken." },
      };
    }
    return { error: "Could not save your changes. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${username}`);
  return { success: true };
}
