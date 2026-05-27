"use client";

import { useState } from "react";
import { Check, Users } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const SHARE_TEXT =
  "Lucky Cockroach Awaaz — a space for India's students and youth to share what they're going through, and stand with people who understand.";

export function InviteButton({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function invite() {
    const data = {
      title: "Lucky Cockroach Awaaz",
      text: SHARE_TEXT,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share(data);
        return;
      }
    } catch (err) {
      // User cancelled the share sheet; treat as no-op.
      if ((err as { name?: string })?.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied to your clipboard.");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Couldn't copy the link. Long-press to copy manually.");
    }
  }

  return (
    <button
      type="button"
      onClick={invite}
      aria-label="Invite friends to Lucky Cockroach Awaaz"
      className={className}
    >
      {copied ? <Check size={14} /> : <Users size={14} />}
      {copied ? "Link copied" : "Invite friends"}
    </button>
  );
}
