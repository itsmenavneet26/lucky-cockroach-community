"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  MessageSquare,
  Bookmark,
  Bell,
  Award,
  Settings,
  Home,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

type Link = { href: string; label: string; icon: typeof LayoutDashboard };

const primary: Link[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function buildLinks(username: string): { profile: Link[]; account: Link[] } {
  return {
    profile: [
      { href: `/u/${username}`, label: "Profile", icon: UserCircle },
      { href: `/u/${username}`, label: "My posts", icon: FileText },
      {
        href: `/u/${username}?tab=comments`,
        label: "My comments",
        icon: MessageSquare,
      },
      { href: "/saved", label: "Saved", icon: Bookmark },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/leaderboard", label: "Badges & karma", icon: Award },
    ],
    account: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/", label: "Back to community", icon: Home },
    ],
  };
}

export function UserSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { profile, account } = buildLinks(username);

  useEffect(() => {
    setCollapsed(localStorage.getItem("lcc-dashboard-sidebar") === "collapsed");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(
        "lcc-dashboard-sidebar",
        next ? "collapsed" : "open",
      );
    } catch {}
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-border py-4",
          collapsed ? "justify-center px-3" : "gap-2.5 px-5",
        )}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-accent text-on-accent">
            <BrandMark className="h-6 w-6" />
          </span>
          {!collapsed && (
            <span className="leading-tight">
              <span className="block text-[14px] font-semibold tracking-[0.06em] text-ink">
                LUCKY COCKROACH
              </span>
              <span className="block text-[10px] font-medium tracking-[0.26em] text-muted">
                COMMUNITY
              </span>
            </span>
          )}
        </Link>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "mx-3 mt-3 grid h-9 place-items-center rounded-[var(--radius)] text-muted hover:bg-surface-2 hover:text-ink",
          collapsed ? "w-9" : "ml-auto w-9 mr-3",
        )}
      >
        {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
      </button>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
        <SidebarSection
          links={primary}
          pathname={pathname}
          collapsed={collapsed}
        />
        {!collapsed && (
          <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            You
          </p>
        )}
        <SidebarSection
          links={profile}
          pathname={pathname}
          collapsed={collapsed}
        />
        {!collapsed && (
          <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Account
          </p>
        )}
        <SidebarSection
          links={account}
          pathname={pathname}
          collapsed={collapsed}
        />
      </nav>
    </aside>
  );
}

function SidebarSection({
  links,
  pathname,
  collapsed,
}: {
  links: Link[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <li key={`${href}-${label}`}>
            <Link
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-[14px] font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-ink-soft hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
