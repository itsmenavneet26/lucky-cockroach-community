"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, LayoutDashboard, Settings, Shield, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

export function UserMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = profile.display_name || profile.username;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: `/u/${profile.username}`, label: "Your profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  if (profile.role === "admin")
    items.push({ href: "/admin", label: "Admin panel", icon: Shield });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="grid h-9 w-9 place-items-center rounded-full hover:ring-2 hover:ring-border-strong"
      >
        <Avatar src={profile.avatar_url} name={name} size={32} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-[12px] text-muted">
              @{profile.username} · {profile.karma} karma
            </p>
          </div>
          <ul className="py-1">
            {items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <Icon size={16} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <form action={signOut} className="border-t border-border">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
