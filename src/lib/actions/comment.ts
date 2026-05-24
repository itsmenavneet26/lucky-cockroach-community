"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireActiveUser } from "@/lib/auth";
import {
  fail,
  forbidden,
  fromZod,
  mapDbError,
  notFound,
  ok,
  unauthenticated,
  type ActionResult,
} from "@/lib/errors";

/** Notify mentioned users (@username). Best-effort, never blocks the comment. */
async function notifyMentions(
  text: string,
  commentId: string,
  authorId: string,
) {
  const usernames = [
    ...new Set(
      [...text.matchAll(/@([a-z0-9_]{3,20})/gi)].map((m) => m[1].toLowerCase()),
    ),
  ].slice(0, 10);
  if (usernames.length === 0) return;

  const service = createServiceClient();
  const { data: people, error } = await service
    .from("profiles")
    .select("id, username")
    .in("username", usernames);
  if (error) {
    console.error("[comment] notifyMentions lookup:", error.message);
    return;
  }
  const targets = (people ?? []).filter((p) => p.id !== authorId);
  if (targets.length === 0) return;

  const { error: insertErr } = await service.from("notifications").insert(
    targets.map((p) => ({
      user_id: p.id,
      type: "mention" as const,
      actor_id: authorId,
      target_type: "comment",
      target_id: commentId,
    })),
  );
  if (insertErr) {
    console.error("[comment] notifyMentions insert:", insertErr.message);
  }
}

const bodySchema = z
  .string()
  .trim()
  .min(1, "Write something first.")
  .max(5000, "Comment is too long (5000 character max).");

export async function createComment(
  postId: string,
  parentId: string | null,
  text: string,
): Promise<ActionResult> {
  const parsed = bodySchema.safeParse(text);
  if (!parsed.success) return fromZod(parsed.error);

  const active = await requireActiveUser();
  if (!active.ok) return active.failure;
  const supabase = await createClient();

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("is_locked")
    .eq("id", postId)
    .maybeSingle();
  if (postErr) return mapDbError("comment.postLookup", postErr);
  if (!post) return notFound("This post no longer exists.");
  if (post.is_locked)
    return fail("forbidden", "This post is locked — no new comments.");

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: active.user.id,
      parent_id: parentId,
      body: {},
      body_text: parsed.data,
    })
    .select("id")
    .single();
  if (error || !comment) {
    if (error?.code === "42501")
      return fail(
        "rate_limited",
        "You're commenting too quickly. Please slow down.",
      );
    return mapDbError("comment.insert", error ?? { message: "no row" });
  }

  await notifyMentions(parsed.data, comment.id, active.user.id);

  revalidatePath(`/post/${postId}`);
  return ok();
}

type OwnerCheck =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; failure: ActionResult };

/** Confirm the caller authored `commentId`; defence in depth on top of RLS. */
async function requireCommentOwner(commentId: string): Promise<OwnerCheck> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, failure: unauthenticated() };
  const { data, error } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .maybeSingle();
  if (error) return { ok: false, failure: mapDbError("comment.ownerLookup", error) };
  if (!data) return { ok: false, failure: notFound("That comment no longer exists.") };
  if (data.author_id !== userData.user.id)
    return { ok: false, failure: forbidden("You can only edit your own comments.") };
  return { ok: true, supabase };
}

export async function editComment(
  commentId: string,
  postId: string,
  text: string,
): Promise<ActionResult> {
  const parsed = bodySchema.safeParse(text);
  if (!parsed.success) return fromZod(parsed.error);

  const owner = await requireCommentOwner(commentId);
  if (!owner.ok) return owner.failure;

  const { error } = await owner.supabase
    .from("comments")
    .update({ body_text: parsed.data, edited_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error) return mapDbError("comment.edit", error);

  revalidatePath(`/post/${postId}`);
  return ok();
}

export async function deleteComment(
  commentId: string,
  postId: string,
): Promise<ActionResult> {
  const owner = await requireCommentOwner(commentId);
  if (!owner.ok) return owner.failure;

  const { error } = await owner.supabase
    .from("comments")
    .update({ is_removed: true })
    .eq("id", commentId);
  if (error) return mapDbError("comment.delete", error);

  revalidatePath(`/post/${postId}`);
  return ok();
}
