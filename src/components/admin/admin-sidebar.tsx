"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Hash,
  Users,
  Flag,
  HeartHandshake,
  ImageIcon,
  Settings,
  ScrollText,
  LifeBuoy,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/topics", label: "Topics", icon: Hash },
  { href: "/admin/users", label: "Members", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/volunteers", label: "Volunteers", icon: HeartHandshake },
  { href: "/admin/appearance", label: "Appearance", icon: ImageIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem("lcc-admin-sidebar") === "collapsed");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("lcc-admin-sidebar", next ? "collapsed" : "open");
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
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "mx-3 mt-3 flex h-8 items-center rounded-[var(--radius)] text-ink-soft hover:bg-surface-2",
          collapsed ? "justify-center" : "justify-end px-2",
        )}
      >
        {collapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
      </button>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius)] py-2.5 text-[14px] font-medium",
                    collapsed ? "justify-center px-0" : "px-3",
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="m-3 rounded-[var(--radius-lg)] border border-border bg-surface-2 p-4">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent">
            <LifeBuoy size={18} />
          </span>
          <p className="mt-2 text-[13px] font-semibold text-ink">Need help?</p>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">
            Visit the help center or community guidelines.
          </p>
          <Link
            href="/guidelines"
            className="mt-2.5 flex h-8 items-center justify-center rounded-[var(--radius)] bg-accent text-[12px] font-semibold text-on-accent hover:bg-accent-hover"
          >
            Open guidelines
          </Link>
        </div>
      )}
    </aside>
  );
}
