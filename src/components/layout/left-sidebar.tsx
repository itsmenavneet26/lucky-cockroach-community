"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Compass,
  Bookmark,
  Trophy,
  Hash,
  HeartHandshake,
  HeartPulse,
  GraduationCap,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { InviteButton } from "@/components/layout/invite-button";
import { cn } from "@/lib/utils";

type TopicLink = { slug: string; name: string };

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/volunteer", label: "Volunteer", icon: HeartHandshake },
  { href: "/scholarship", label: "Scholarship", icon: GraduationCap },
  { href: "/mental-health", label: "Mental health", icon: HeartPulse },
];

export function LeftSidebar({
  topics = [],
  inDrawer = false,
}: {
  topics?: TopicLink[];
  inDrawer?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (inDrawer) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem("lcc-sidebar") === "collapsed");
  }, [inDrawer]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("lcc-sidebar", next ? "collapsed" : "open");
    } catch {}
  }

  const mini = collapsed && !inDrawer;

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex flex-col text-[14px] transition-[width] duration-200",
        inDrawer ? "w-full" : mini ? "w-[64px]" : "w-[244px]",
      )}
    >
      {/* Header row with collapse toggle */}
      {!inDrawer && (
        <div
          className={cn(
            "mb-2 flex items-center",
            mini ? "justify-center" : "justify-between px-3",
          )}
        >
          {!mini && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Browse
            </span>
          )}
          <button
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="grid h-8 w-8 place-items-center rounded-[var(--radius)] text-muted hover:bg-surface-2 hover:text-ink"
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      )}

      {/* Main nav */}
      <ul className="flex flex-col gap-px">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                title={mini ? label : undefined}
                className={cn(
                  "group flex items-center rounded-[var(--radius)] font-medium",
                  mini ? "h-10 justify-center" : "h-9 gap-3 px-3",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon
                  size={mini ? 19 : 17}
                  className={cn(
                    "shrink-0",
                    active ? "text-accent" : "text-ink-soft group-hover:text-ink",
                  )}
                />
                {!mini && <span className="truncate">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Topics */}
      {!mini && topics.length > 0 && (
        <div className="mt-5">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Topics
          </p>
          <ul className="flex flex-col gap-px">
            {topics.map((topic) => {
              const href = `/t/${topic.slug}`;
              const active = pathname === href;
              return (
                <li key={topic.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "flex h-8 items-center gap-2.5 rounded-[var(--radius)] px-3",
                      active
                        ? "bg-accent-soft text-accent"
                        : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <Hash size={14} className="shrink-0 text-muted" />
                    <span className="truncate text-[13px]">{topic.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Invite card */}
      {!mini && (
        <div className="mt-5 rounded-[var(--radius-lg)] border border-accent/25 bg-accent-soft p-4 text-center">
          <div className="flex justify-center gap-1 text-accent">
            <BrandMark className="h-7 w-7" />
            <BrandMark className="h-5 w-5 self-end opacity-70" />
          </div>
          <p className="mt-2 text-[14px] font-semibold text-ink">
            Small steps. Big change.
          </p>
          <p className="mt-0.5 text-[12px] text-ink-soft">
            Together, we go further.
          </p>
          <InviteButton
            url={process.env.NEXT_PUBLIC_SITE_URL || "https://community.luckycockroach.com"}
            className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-accent text-[13px] font-semibold text-on-accent hover:bg-accent-hover"
          />
        </div>
      )}
    </nav>
  );
}
