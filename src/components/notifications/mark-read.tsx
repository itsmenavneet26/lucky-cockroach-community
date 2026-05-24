"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead } from "@/lib/actions/notification";

/** Marks all notifications read once when the page is opened. */
export function MarkReadOnMount({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !hasUnread) return;
    done.current = true;
    markAllNotificationsRead().then(() => router.refresh());
  }, [hasUnread, router]);

  return null;
}
