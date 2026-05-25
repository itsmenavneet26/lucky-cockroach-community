"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { deleteNotification } from "@/lib/actions/notification";

export function DeleteNotificationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label="Delete notification"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await deleteNotification(id);
          router.refresh();
        })
      }
      className="shrink-0 grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50"
    >
      <X size={14} />
    </button>
  );
}
