"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LeftSidebar } from "@/components/layout/left-sidebar";

export function MobileMenu({
  topics = [],
}: {
  topics?: { slug: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // The trigger lives inside a sticky <header> that uses backdrop-filter,
  // which creates a containing block for position:fixed children. Render the
  // overlay through a portal so the drawer fills the viewport instead of
  // being trapped inside the header.
  const drawer = open ? (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="absolute left-0 top-0 flex h-full w-[280px] max-w-[85%] flex-col overflow-y-auto bg-surface p-4 shadow-pop">
        {/* Brand row — mirrors the desktop site header so the drawer feels
            anchored, not orphan. Tapping the wordmark goes home and closes
            the drawer; the X button on the right just closes it. */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            aria-label="Lucky Cockroach Awaaz — home"
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius)] bg-accent text-on-accent">
              <BrandMark className="h-5 w-5" />
            </span>
            <span className="text-[14px] font-semibold leading-tight tracking-tight text-ink">
              Lucky Cockroach
              <span className="block text-[12px] font-semibold text-accent">
                Awaaz
              </span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-[var(--radius)] text-ink-soft hover:bg-surface-2"
          >
            <X size={20} />
          </button>
        </div>
        <div onClick={() => setOpen(false)}>
          <LeftSidebar topics={topics} inDrawer />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid h-9 w-9 place-items-center rounded-[var(--radius)] text-ink-soft hover:bg-surface-2 lg:hidden"
      >
        <Menu size={20} />
      </button>
      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}
