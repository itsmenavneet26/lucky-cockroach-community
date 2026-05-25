"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapDbError, ok, unauthenticated, type ActionResult } from "@/lib/errors";

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return unauthenticated();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userData.user.id)
    .eq("is_read", false);
  if (error) return mapDbError("notifications.markAllRead", error);

  revalidatePath("/notifications");
  return ok();
}

export async function markNotificationRead(
  id: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return unauthenticated();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userData.user.id);
  if (error) return mapDbError("notifications.markRead", error);

  revalidatePath("/notifications");
  return ok();
}

export async function deleteNotification(
  id: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return unauthenticated();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id);
  if (error) return mapDbError("notifications.delete", error);

  revalidatePath("/notifications");
  return ok();
}
