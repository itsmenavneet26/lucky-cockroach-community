"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck } from "lucide-react";
import { toggleFollow } from "@/lib/actions/follow";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function FollowButton({
  targetId,
  initialFollowing,
  signedIn,
  revalidate,
}: {
  targetId: string;
  initialFollowing: boolean;
  signedIn: boolean;
  revalidate?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const prev = following;
    setFollowing(!prev);
    startTransition(async () => {
      const res = await toggleFollow("user", targetId, revalidate);
      if (!res.ok) {
        setFollowing(prev);
        toast.error(res.error || "Couldn't update follow.");
      } else {
        setFollowing(res.following);
      }
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold disabled:opacity-60",
        following
          ? "border border-border-strong text-ink-soft hover:bg-surface-2"
          : "bg-accent text-on-accent hover:bg-accent-hover",
      )}
    >
      {following ? <UserCheck size={15} /> : <UserPlus size={15} />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
