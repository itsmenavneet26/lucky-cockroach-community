"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Check, X } from "lucide-react";
import {
  resolveReport,
  setPostRemoved,
  setCommentRemoved,
} from "@/lib/actions/moderation";
import { useToast } from "@/components/ui/toast";

export function ModReportActions({
  reportId,
  targetType,
  targetId,
  postId,
  alreadyRemoved,
}: {
  reportId: string;
  targetType: "post" | "comment";
  targetId: string;
  postId: string | null;
  alreadyRemoved: boolean;
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

  return (
    <div className="flex flex-wrap gap-2">
      {!alreadyRemoved && (
        <button
          disabled={pending}
          onClick={() =>
            run(async () => {
              const removed =
                targetType === "post"
                  ? await setPostRemoved(targetId, true, "Removed via report")
                  : postId
                    ? await setCommentRemoved(targetId, postId, true)
                    : { ok: false, error: "Missing post id." };
              if (!removed.ok) return removed;
              return resolveReport(reportId, "resolved");
            }, "Content removed and report resolved.")
          }
          className="flex items-center gap-1.5 rounded-full bg-danger px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
        >
          <Trash2 size={13} /> Remove content
        </button>
      )}
      <button
        disabled={pending}
        onClick={() =>
          run(() => resolveReport(reportId, "resolved"), "Report resolved.")
        }
        className="flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-[12px] font-semibold text-ink-soft hover:bg-surface-2 disabled:opacity-60"
      >
        <Check size={13} /> Mark resolved
      </button>
      <button
        disabled={pending}
        onClick={() =>
          run(() => resolveReport(reportId, "dismissed"), "Report dismissed.")
        }
        className="flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-[12px] font-semibold text-ink-soft hover:bg-surface-2 disabled:opacity-60"
      >
        <X size={13} /> Dismiss
      </button>
    </div>
  );
}
