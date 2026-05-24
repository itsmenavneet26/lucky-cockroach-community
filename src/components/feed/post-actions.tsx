"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Share2, Check } from "lucide-react";
import { toggleSave } from "@/lib/actions/vote";
import { useToast } from "@/components/ui/toast";
import type { TargetType } from "@/lib/types";

const btn =
  "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink";

export function SaveButton({
  targetType,
  targetId,
  initialSaved,
  signedIn,
}: {
  targetType: TargetType;
  targetId: string;
  initialSaved: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();

  function onClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const prev = saved;
    setSaved(!prev);
    startTransition(async () => {
      const res = await toggleSave(targetType, targetId);
      if (!res.ok) {
        setSaved(prev);
        toast.error(res.error || "Couldn't update your saved posts.");
      } else {
        setSaved(res.saved);
      }
    });
  }

  return (
    <button onClick={onClick} className={btn} aria-pressed={saved}>
      <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

export function ShareButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  function onClick() {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path;
    if (!navigator.clipboard) {
      toast.error("Your browser doesn't support copying. Long-press the URL instead.");
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => toast.error("Couldn't copy the link."));
  }

  return (
    <button onClick={onClick} className={btn}>
      {copied ? <Check size={15} /> : <Share2 size={15} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
