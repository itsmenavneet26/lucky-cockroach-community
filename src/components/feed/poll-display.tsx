"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { castPollVote } from "@/lib/actions/poll";
import { useToast } from "@/components/ui/toast";
import type { PollOption } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function PollDisplay({
  postId,
  options,
  viewerOptionId,
  signedIn,
}: {
  postId: string;
  options: PollOption[];
  viewerOptionId: string | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const total = options.reduce((s, o) => s + o.vote_count, 0);
  const hasVoted = viewerOptionId !== null;

  function vote(optionId: string) {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      const res = await castPollVote(postId, optionId);
      if (res.ok) router.refresh();
      else toast.error(res.error || "Couldn't record your vote.");
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {options.map((opt) => {
        const pct = total > 0 ? Math.round((opt.vote_count / total) * 100) : 0;
        const mine = viewerOptionId === opt.id;
        if (hasVoted) {
          return (
            <div
              key={opt.id}
              className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-surface-2"
            >
              <div
                className="absolute inset-y-0 left-0 bg-accent-soft"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between px-3 py-2.5 text-[14px]">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  {mine && <Check size={14} className="text-accent" />}
                  {opt.label}
                </span>
                <span className="font-semibold text-ink-soft">{pct}%</span>
              </div>
            </div>
          );
        }
        return (
          <button
            key={opt.id}
            onClick={() => vote(opt.id)}
            disabled={pending}
            className={cn(
              "rounded-[var(--radius)] border border-border bg-surface px-3 py-2.5 text-left text-[14px] font-medium text-ink hover:border-accent disabled:opacity-60",
            )}
          >
            {opt.label}
          </button>
        );
      })}
      <p className="text-[12px] text-muted">
        {total} {total === 1 ? "vote" : "votes"}
        {hasVoted ? " · you voted" : signedIn ? "" : " · sign in to vote"}
      </p>
    </div>
  );
}
