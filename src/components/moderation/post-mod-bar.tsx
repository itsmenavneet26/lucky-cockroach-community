"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trash2, RotateCcw, Lock, LockOpen, Pin } from "lucide-react";
import {
  setPostRemoved,
  setPostLocked,
  setPostPinned,
} from "@/lib/actions/moderation";
import { useToast } from "@/components/ui/toast";

export function PostModBar({
  postId,
  isRemoved,
  isLocked,
  isPinned,
}: {
  postId: string;
  isRemoved: boolean;
  isLocked: boolean;
  isPinned: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function run(
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMessage?: string,
  ) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error(res.error || "Couldn't apply the change.");
        return;
      }
      if (successMessage) toast.success(successMessage);
      router.refresh();
    });
  }

  const btn =
    "flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-[12px] font-semibold text-ink-soft hover:bg-surface disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-accent/30 bg-accent-soft px-3 py-2">
      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-accent">
        <Shield size={14} /> Moderator
      </span>
      <button
        disabled={pending}
        onClick={() =>
          run(
            () => setPostRemoved(postId, !isRemoved),
            isRemoved ? "Post restored." : "Post removed.",
          )
        }
        className={btn}
      >
        {isRemoved ? <RotateCcw size={13} /> : <Trash2 size={13} />}
        {isRemoved ? "Restore" : "Remove"}
      </button>
      <button
        disabled={pending}
        onClick={() =>
          run(
            () => setPostLocked(postId, !isLocked),
            isLocked ? "Post unlocked." : "Post locked.",
          )
        }
        className={btn}
      >
        {isLocked ? <LockOpen size={13} /> : <Lock size={13} />}
        {isLocked ? "Unlock" : "Lock"}
      </button>
      <button
        disabled={pending}
        onClick={() =>
          run(
            () => setPostPinned(postId, !isPinned),
            isPinned ? "Post unpinned." : "Post pinned.",
          )
        }
        className={btn}
      >
        <Pin size={13} />
        {isPinned ? "Unpin" : "Pin"}
      </button>
    </div>
  );
}
