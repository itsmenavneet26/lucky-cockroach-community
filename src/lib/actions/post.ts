"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

/** Confirm the caller authored `postId`. Defence-in-depth on top of RLS. */
async function requirePostOwner(postId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false as const, failure: unauthenticated() };
  const { data, error } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();
  if (error) return { ok: false as const, failure: mapDbError("post.ownerLookup", error) };
  if (!data) return { ok: false as const, failure: notFound("This post no longer exists.") };
  if (data.author_id !== userData.user.id)
    return { ok: false as const, failure: forbidden("You can only modify your own posts.") };
  return { ok: true as const, supabase };
}

const editSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(300, "Title must be at most 300 characters."),
  bodyText: z.string().trim().max(20000),
});

/** Author edits their own post (title + plain body text). */
export async function updatePost(
  postId: string,
  title: string,
  bodyText: string,
): Promise<ActionResult> {
  const parsed = editSchema.safeParse({ title, bodyText });
  if (!parsed.success) return fromZod(parsed.error);

  const owner = await requirePostOwner(postId);
  if (!owner.ok) return owner.failure;

  const { error } = await owner.supabase
    .from("posts")
    .update({
      title: parsed.data.title,
      body_text: parsed.data.bodyText,
      edited_at: new Date().toISOString(),
    })
    .eq("id", postId);
  if (error) return mapDbError("post.update", error);

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
  return ok();
}

/** Author deletes their own post. Hard delete — cascades to comments/votes. */
export async function deletePost(postId: string): Promise<ActionResult> {
  const owner = await requirePostOwner(postId);
  if (!owner.ok) return owner.failure;

  const { error } = await owner.supabase.from("posts").delete().eq("id", postId);
  if (error) {
    if (error.code === "42501")
      return fail("forbidden", "You can't delete this post right now.");
    return mapDbError("post.delete", error);
  }
  revalidatePath("/");
  redirect("/");
}
