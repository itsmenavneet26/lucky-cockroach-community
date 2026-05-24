"use server";

import { createClient } from "@/lib/supabase/server";
import { requireActiveUser } from "@/lib/auth";
import {
  fail,
  mapDbError,
  ok,
  unauthenticated,
  type ActionResult,
} from "@/lib/errors";
import type { TargetType } from "@/lib/types";

type ToggleSaveResult =
  | { ok: true; saved: boolean }
  | { ok: false; saved: false; code: string; error: string };

/**
 * Toggle a vote atomically via SQL RPC.
 * Same value un-votes, different value flips. No read-modify-write
 * race conditions; the votes_apply trigger handles score/karma deltas.
 */
export async function castVote(
  targetType: TargetType,
  targetId: string,
  value: -1 | 1,
): Promise<ActionResult> {
  const active = await requireActiveUser();
  if (!active.ok) return active.failure;
  const supabase = await createClient();

  const { error } = await supabase.rpc("toggle_vote_atomic", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_value: value,
  });
  if (error) {
    if (error.message?.includes("own content"))
      return fail("forbidden", "You can't vote on your own content.");
    if (error.code === "42501")
      return { ...unauthenticated(), error: "Sign in to vote." };
    return mapDbError("vote.rpc", error);
  }
  return ok();
}

/** Toggle a save/bookmark atomically. Returns the new saved state. */
export async function toggleSave(
  targetType: TargetType,
  targetId: string,
): Promise<ToggleSaveResult> {
  const active = await requireActiveUser();
  if (!active.ok) {
    return {
      ok: false,
      saved: false,
      code: active.failure.code,
      error: active.failure.error,
    };
  }
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("toggle_save_atomic", {
    p_target_type: targetType,
    p_target_id: targetId,
  });
  if (error) {
    const mapped = mapDbError("save.rpc", error);
    return { ok: false, saved: false, code: mapped.code, error: mapped.error };
  }
  return { ok: true, saved: Boolean(data) };
}
