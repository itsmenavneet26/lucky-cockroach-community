"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveUser } from "@/lib/auth";
import { fail, mapDbError } from "@/lib/errors";
import type { FollowTarget } from "@/lib/types";

type ToggleFollowResult =
  | { ok: true; following: boolean }
  | { ok: false; following: false; code: string; error: string };

export async function toggleFollow(
  targetType: FollowTarget,
  targetId: string,
  revalidate?: string,
): Promise<ToggleFollowResult> {
  const active = await requireActiveUser();
  if (!active.ok) {
    return {
      ok: false,
      following: false,
      code: active.failure.code,
      error: active.failure.error,
    };
  }
  const supabase = await createClient();
  if (targetType === "user" && targetId === active.user.id) {
    const f = fail("validation", "You can't follow yourself.");
    return { ok: false, following: false, code: f.code, error: f.error };
  }

  const { data: existing, error: lookupErr } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", active.user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();
  if (lookupErr) {
    const m = mapDbError("follow.lookup", lookupErr);
    return { ok: false, following: false, code: m.code, error: m.error };
  }

  if (existing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", existing.id);
    if (error) {
      const m = mapDbError("follow.delete", error);
      return { ok: false, following: false, code: m.code, error: m.error };
    }
    if (revalidate) revalidatePath(revalidate);
    return { ok: true, following: false };
  }
  const { error } = await supabase.from("follows").insert({
    follower_id: active.user.id,
    target_type: targetType,
    target_id: targetId,
  });
  if (error) {
    const m = mapDbError("follow.insert", error);
    return { ok: false, following: false, code: m.code, error: m.error };
  }
  if (revalidate) revalidatePath(revalidate);
  return { ok: true, following: true };
}
