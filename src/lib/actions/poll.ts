"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveUser } from "@/lib/auth";
import { fail, mapDbError, ok } from "@/lib/errors";

export async function castPollVote(postId: string, optionId: string) {
  const active = await requireActiveUser();
  if (!active.ok) return active.failure;
  const supabase = await createClient();

  const { error } = await supabase.from("poll_votes").insert({
    user_id: active.user.id,
    post_id: postId,
    poll_option_id: optionId,
  });
  if (error) {
    if (error.code === "23505")
      return fail("conflict", "You've already voted in this poll.");
    return mapDbError("poll.vote", error);
  }

  revalidatePath(`/post/${postId}`);
  return ok();
}
