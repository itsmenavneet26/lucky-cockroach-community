"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireActiveUser } from "@/lib/auth";
import {
  forbidden,
  fromZod,
  mapDbError,
  ok,
  type ActionResult,
} from "@/lib/errors";
import type { ReportReason, TargetType, UserRole } from "@/lib/types";

/** Resolve the caller and confirm they are a moderator or admin. */
async function requireMod(): Promise<{ id: string; role: UserRole } | null> {
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) {
    console.error("[moderation] requireMod profile lookup:", error.message);
    return null;
  }
  if (data?.role === "moderator" || data?.role === "admin")
    return { id: userData.user.id, role: data.role };
  return null;
}

async function audit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  meta: Record<string, unknown> = {},
) {
  const { error } = await createServiceClient()
    .from("mod_audit_log")
    .insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      meta,
    });
  if (error) {
    console.error("[moderation] audit:", action, error.message);
  }
}

// ── Reporting (any signed-in member) ─────────────────────────
const reportSchema = z.object({
  reason: z.enum([
    "spam",
    "harassment",
    "misinformation",
    "hate",
    "self_harm",
    "other",
  ]),
  details: z.string().trim().max(500).optional(),
});

export async function reportContent(
  targetType: TargetType,
  targetId: string,
  reason: ReportReason,
  details?: string,
): Promise<ActionResult> {
  const parsed = reportSchema.safeParse({ reason, details });
  if (!parsed.success) return fromZod(parsed.error);

  const active = await requireActiveUser();
  if (!active.ok) return active.failure;
  const supabase = await createClient();

  const { error } = await supabase.from("reports").insert({
    reporter_id: active.user.id,
    target_type: targetType,
    target_id: targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });
  if (error) {
    if (error.code === "23505")
      return ok(); // already reported by this user — idempotent
    return mapDbError("moderation.report", error);
  }
  return ok();
}

// ── Report queue ─────────────────────────────────────────────
export async function resolveReport(
  reportId: string,
  status: "resolved" | "dismissed",
): Promise<ActionResult> {
  const mod = await requireMod();
  if (!mod) return forbidden("Only moderators can resolve reports.");
  const { error } = await createServiceClient()
    .from("reports")
    .update({
      status,
      resolved_by: mod.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) return mapDbError("moderation.resolveReport", error);
  await audit(mod.id, `report_${status}`, "report", reportId);
  revalidatePath("/admin/reports");
  return ok();
}

// ── Post moderation ──────────────────────────────────────────
export async function setPostRemoved(
  postId: string,
  removed: boolean,
  reason?: string,
): Promise<ActionResult> {
  const mod = await requireMod();
  if (!mod) return forbidden("Only moderators can do that.");
  const { error } = await createServiceClient()
    .from("posts")
    .update({ is_removed: removed, removed_reason: reason ?? null })
    .eq("id", postId);
  if (error) return mapDbError("moderation.setPostRemoved", error);
  await audit(
    mod.id,
    removed ? "post_removed" : "post_restored",
    "post",
    postId,
    { reason },
  );
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin/reports");
  return ok();
}

export async function setPostLocked(
  postId: string,
  locked: boolean,
): Promise<ActionResult> {
  const mod = await requireMod();
  if (!mod) return forbidden("Only moderators can do that.");
  const { error } = await createServiceClient()
    .from("posts")
    .update({ is_locked: locked })
    .eq("id", postId);
  if (error) return mapDbError("moderation.setPostLocked", error);
  await audit(
    mod.id,
    locked ? "post_locked" : "post_unlocked",
    "post",
    postId,
  );
  revalidatePath(`/post/${postId}`);
  return ok();
}

export async function setPostPinned(
  postId: string,
  pinned: boolean,
): Promise<ActionResult> {
  const mod = await requireMod();
  if (!mod) return forbidden("Only moderators can do that.");
  const { error } = await createServiceClient()
    .from("posts")
    .update({ is_pinned: pinned })
    .eq("id", postId);
  if (error) return mapDbError("moderation.setPostPinned", error);
  await audit(
    mod.id,
    pinned ? "post_pinned" : "post_unpinned",
    "post",
    postId,
  );
  revalidatePath(`/post/${postId}`);
  return ok();
}

export async function setCommentRemoved(
  commentId: string,
  postId: string,
  removed: boolean,
): Promise<ActionResult> {
  const mod = await requireMod();
  if (!mod) return forbidden("Only moderators can do that.");
  const { error } = await createServiceClient()
    .from("comments")
    .update({ is_removed: removed })
    .eq("id", commentId);
  if (error) return mapDbError("moderation.setCommentRemoved", error);
  await audit(
    mod.id,
    removed ? "comment_removed" : "comment_restored",
    "comment",
    commentId,
  );
  revalidatePath(`/post/${postId}`);
  return ok();
}

// ── User bans (admin only for sitewide) ──────────────────────
export async function banUser(
  userId: string,
  reason: string,
  days: number | null,
): Promise<ActionResult> {
  const mod = await requireMod();
  if (!mod || mod.role !== "admin")
    return forbidden("Only admins can ban members.");

  const service = createServiceClient();
  const expires =
    days && days > 0
      ? new Date(Date.now() + days * 86400000).toISOString()
      : null;
  // bans → trigger keeps profiles.is_banned in sync (see 0011_production_hardening.sql).
  const { error: banErr } = await service.from("bans").insert({
    user_id: userId,
    topic_id: null,
    reason,
    banned_by: mod.id,
    expires_at: expires,
  });
  if (banErr) return mapDbError("moderation.banUser.insert", banErr);
  await audit(mod.id, "user_banned", "user", userId, { reason, days });
  revalidatePath("/admin");
  return ok();
}

export async function unbanUser(userId: string): Promise<ActionResult> {
  const mod = await requireMod();
  if (!mod || mod.role !== "admin")
    return forbidden("Only admins can unban members.");
  const service = createServiceClient();
  // Trigger on bans → keeps profiles.is_banned in sync.
  const { error: banErr } = await service
    .from("bans")
    .delete()
    .eq("user_id", userId);
  if (banErr) return mapDbError("moderation.unbanUser.delete", banErr);
  await audit(mod.id, "user_unbanned", "user", userId);
  revalidatePath("/admin");
  return ok();
}
