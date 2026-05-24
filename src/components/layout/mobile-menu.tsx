"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LeftSidebar } from "@/components/layout/left-sidebar";

export function MobileMenu({
  topics = [],
}: {
  topics?: { slug: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid h-9 w-9 place-items-center rounded-[var(--radius)] text-ink-soft hover:bg-surface-2 lg:hidden"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[280px] overflow-y-auto bg-surface p-4 shadow-pop">
            <div className="mb-4 flex justify-end">
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
      )}
    </>
  );
}
