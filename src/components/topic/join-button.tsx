"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { toggleTopicMembership } from "@/lib/actions/topic";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function JoinButton({
  topicId,
  slug,
  initialJoined,
  signedIn,
}: {
  topicId: string;
  slug: string;
  initialJoined: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [joined, setJoined] = useState(initialJoined);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const prev = joined;
    setJoined(!prev);
    startTransition(async () => {
      const res = await toggleTopicMembership(topicId, slug);
      if (!res.ok) {
        setJoined(prev);
        toast.error(res.error || "Couldn't update your membership.");
      } else {
        setJoined(res.joined);
      }
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold disabled:opacity-60",
        joined
          ? "border border-border-strong text-ink-soft hover:bg-surface-2"
          : "bg-accent text-on-accent hover:bg-accent-hover",
      )}
    >
      {joined ? <Check size={15} /> : <Plus size={15} />}
      {joined ? "Joined" : "Join"}
    </button>
  );
}
