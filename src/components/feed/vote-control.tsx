"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { castVote } from "@/lib/actions/vote";
import { useToast } from "@/components/ui/toast";
import { formatCount, cn } from "@/lib/utils";
import type { TargetType } from "@/lib/types";

export function VoteControl({
  targetType,
  targetId,
  initialScore,
  initialVote,
  signedIn,
  layout = "vertical",
}: {
  targetType: TargetType;
  targetId: string;
  initialScore: number;
  initialVote: -1 | 0 | 1;
  signedIn: boolean;
  layout?: "vertical" | "horizontal";
}) {
  const router = useRouter();
  const toast = useToast();
  const [vote, setVote] = useState<-1 | 0 | 1>(initialVote);
  const [score, setScore] = useState(initialScore);
  const [, startTransition] = useTransition();

  function cast(next: -1 | 1) {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const prevVote = vote;
    const prevScore = score;
    const applied: -1 | 0 | 1 = prevVote === next ? 0 : next;
    setVote(applied);
    setScore(prevScore - prevVote + applied);

    startTransition(async () => {
      const res = await castVote(targetType, targetId, next);
      if (!res.ok) {
        setVote(prevVote);
        setScore(prevScore);
        toast.error(res.error || "Couldn't record your vote.");
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        layout === "vertical" ? "flex-col" : "flex-row",
      )}
    >
      <button
        aria-label="Upvote"
        aria-pressed={vote === 1}
        onClick={() => cast(1)}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-[var(--radius-xs)] hover:bg-surface-2",
          vote === 1 ? "text-accent" : "text-muted",
        )}
      >
        <ArrowBigUp size={20} fill={vote === 1 ? "currentColor" : "none"} />
      </button>
      <span
        className={cn(
          "min-w-[1.5rem] text-center text-[13px] font-semibold tabular-nums",
          vote === 1 ? "text-accent" : vote === -1 ? "text-negative" : "text-ink",
        )}
      >
        {formatCount(score)}
      </span>
      <button
        aria-label="Downvote"
        aria-pressed={vote === -1}
        onClick={() => cast(-1)}
        className={cn(
          "grid h-7 w-7 place-items-center rounded-[var(--radius-xs)] hover:bg-surface-2",
          vote === -1 ? "text-negative" : "text-muted",
        )}
      >
        <ArrowBigDown size={20} fill={vote === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
