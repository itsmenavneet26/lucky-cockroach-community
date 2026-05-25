"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapDbError } from "@/lib/errors";

type ToggleResult =
  | { ok: true; joined: boolean }
  | { ok: false; joined: false; code: string; error: string };

export async function toggleTopicMembership(
  topicId: string,
  slug: string,
): Promise<ToggleResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      ok: false,
      joined: false,
      code: "unauthenticated",
      error: "Sign in to join topics.",
    };
  }

  const { data: existing, error: lookupErr } = await supabase
    .from("topic_members")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("topic_id", topicId)
    .maybeSingle();
  if (lookupErr) {
    const m = mapDbError("topic.lookup", lookupErr);
    return { ok: false, joined: false, code: m.code, error: m.error };
  }

  if (existing) {
    const { error } = await supabase
      .from("topic_members")
      .delete()
      .eq("id", existing.id);
    if (error) {
      const m = mapDbError("topic.leave", error);
      return { ok: false, joined: false, code: m.code, error: m.error };
    }
    revalidatePath(`/t/${slug}`);
    // `getTopics` is unstable_cache'd with tag "topics" — without this,
    // /explore keeps serving the pre-join member_count for 5 minutes.
    updateTag("topics");
    return { ok: true, joined: false };
  }
  const { error } = await supabase
    .from("topic_members")
    .insert({ user_id: userData.user.id, topic_id: topicId });
  if (error) {
    const m = mapDbError("topic.join", error);
    return { ok: false, joined: false, code: m.code, error: m.error };
  }
  revalidatePath(`/t/${slug}`);
  updateTag("topics");
  return { ok: true, joined: true };
}
