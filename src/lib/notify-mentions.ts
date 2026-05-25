import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { extractMentions } from "@/lib/mentions";

/** Notify @mentioned users. Best-effort, never throws. */
export async function notifyMentions(opts: {
  text: string;
  authorId: string;
  targetType: "post" | "comment";
  targetId: string;
  excludeIds?: string[];
}) {
  const { text, authorId, targetType, targetId, excludeIds = [] } = opts;
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;

  const service = createServiceClient();
  const { data: people, error } = await service
    .from("profiles")
    .select("id, username")
    .in("username", usernames);
  if (error) {
    console.error("[notify-mentions] lookup:", error.message);
    return;
  }
  const skip = new Set([authorId, ...excludeIds]);
  const targets = (people ?? []).filter((p) => !skip.has(p.id));
  if (targets.length === 0) return;

  const { error: insertErr } = await service.from("notifications").insert(
    targets.map((p) => ({
      user_id: p.id,
      type: "mention" as const,
      actor_id: authorId,
      target_type: targetType,
      target_id: targetId,
    })),
  );
  if (insertErr) {
    console.error("[notify-mentions] insert:", insertErr.message);
  }
}
