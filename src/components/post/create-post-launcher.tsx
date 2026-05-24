"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PenLine, X, Type, BarChart3, ImageIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SubmitForm } from "@/app/submit/submit-form";
import type { Topic, Profile } from "@/lib/types";

function Modal({
  topics,
  userId,
  onClose,
}: {
  topics: Topic[];
  userId: string;
  onClose: () => void;
}) {
  // Portal-only render so no ancestor `transform`/`overflow` can break
  // `position: fixed`. Also locks body scroll while open.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create a post"
        className="relative w-full max-w-2xl rounded-[var(--radius-xl)] border border-border bg-surface shadow-pop"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-ink">Create a post</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">
          <SubmitForm topics={topics} defaultType="text" userId={userId} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Header "Create Post" button that opens the post modal. */
export function CreatePostButton({
  topics,
  userId,
}: {
  topics: Topic[];
  userId: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!userId) {
    return (
      <Link href="/login" className="hidden sm:block">
        <Button className="h-10 gap-1.5 rounded-full px-4">
          <PenLine size={16} />
          Create Post
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="hidden h-10 gap-1.5 rounded-full px-4 sm:flex"
      >
        <PenLine size={16} />
        Create Post
      </Button>
      {open && (
        <Modal topics={topics} userId={userId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

const TYPES = [
  { label: "Text", icon: Type },
  { label: "Poll", icon: BarChart3 },
  { label: "Image", icon: ImageIcon },
  { label: "Link", icon: LinkIcon },
];

/** Home-feed composer card that opens the post modal. */
export function ComposerLauncher({
  profile,
  topics,
}: {
  profile: Profile | null;
  topics: Topic[];
}) {
  const [open, setOpen] = useState(false);

  if (!profile) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft">
        <p className="text-[14px] text-ink-soft">
          Sign in to share your story with the community.
        </p>
        <Link
          href="/login"
          className="flex h-9 shrink-0 items-center rounded-full bg-accent px-4 text-[13px] font-semibold text-on-accent hover:bg-accent-hover"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const name = profile.display_name || profile.username;

  return (
    <>
      <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <Avatar src={profile.avatar_url} name={name} size={40} />
          <button
            onClick={() => setOpen(true)}
            className="flex h-11 flex-1 items-center rounded-full border border-border bg-surface-2 px-4 text-left text-[14px] text-muted hover:border-accent"
          >
            What&apos;s on your mind, {name.split(" ")[0]}?
          </button>
        </div>
        <div className="mt-3 flex gap-1 border-t border-border pt-3">
          {TYPES.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setOpen(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] py-2 text-[13px] font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <Icon size={16} className="text-accent" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {open && (
        <Modal
          topics={topics}
          userId={profile.id}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
