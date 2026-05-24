"use client";

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
} from "lucide-react";
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

const titles: Record<string, { title: string; desc: string }> = {
  "/admin/topics": { title: "Topics", desc: "Create, edit, and archive community topics." },
  "/admin/reports": { title: "Reports", desc: "Review and act on reported posts and comments." },
  "/admin/users": { title: "Members", desc: "Manage members, roles, and bans." },
  "/admin/volunteers": { title: "Volunteers", desc: "Review and respond to volunteer applications." },
  "/admin/appearance": { title: "Appearance", desc: "Edit the announcement bar and hero banners." },
  "/admin/settings": { title: "Settings", desc: "Site settings, feature flags, and crisis resources." },
  "/admin/audit": { title: "Audit log", desc: "Every moderation and admin action, logged." },
};

/** Section heading — hidden on the dashboard, which has its own header. */
export function AdminPageTitle() {
  const pathname = usePathname();
  const t = titles[pathname];
  if (!t) return null;
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {t.title}
      </h1>
      <p className="text-[13px] text-muted">{t.desc}</p>
    </div>
  );
}

/** Horizontal nav for small screens where the sidebar is hidden. */
export function AdminNavMobile() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface p-1.5 shadow-soft lg:hidden">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-[var(--radius)] px-3 py-2 text-[13px] font-medium",
              active
                ? "bg-accent-soft text-accent"
                : "text-ink-soft hover:bg-surface-2",
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
