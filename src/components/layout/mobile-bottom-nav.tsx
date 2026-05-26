"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, Bell, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sticky bottom-of-screen navigation for mobile / small tablet. Hidden
 * on `lg` and up where the left sidebar takes over.
 *
 * Intentionally cookie-free: every item is a `<Link>` to a route, and
 * the destination handles its own auth gating via the proxy middleware
 * (`/submit`, `/notifications`, `/dashboard` all redirect to `/login`
 * for signed-out visitors). That keeps the surrounding shell safe to
 * mount inside `<PublicShell>` without dynamising the cached pages.
 */
const items: { href: string; icon: LucideIcon; label: string; match: (p: string) => boolean }[] = [
  { href: "/", icon: Home, label: "Home", match: (p) => p === "/" },
  { href: "/explore", icon: Compass, label: "Explore", match: (p) => p === "/explore" || p.startsWith("/t/") },
  { href: "/submit", icon: PlusCircle, label: "Post", match: (p) => p === "/submit" },
  { href: "/notifications", icon: Bell, label: "Alerts", match: (p) => p === "/notifications" },
  { href: "/dashboard", icon: User, label: "You", match: (p) => p === "/dashboard" || p.startsWith("/settings") || p.startsWith("/u/") },
];

export function MobileBottomNav() {
  const pathname = usePathname() || "/";

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur",
        "lg:hidden",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-[640px] grid-cols-5">
        {items.map(({ href, icon: Icon, label, match }) => {
          const active = match(pathname);
          const isCreate = href === "/submit";
          return (
            <li key={href} className="contents">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 pb-2 pt-2.5 text-[10px] font-medium tracking-wide transition-colors",
                  active ? "text-accent" : "text-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "relative grid place-items-center",
                    isCreate &&
                      "h-9 w-9 -translate-y-0.5 rounded-full bg-accent text-on-accent shadow-sm",
                  )}
                >
                  <Icon
                    size={isCreate ? 20 : 21}
                    className={cn(
                      !isCreate && active && "fill-accent/15",
                    )}
                    strokeWidth={isCreate ? 2.25 : active ? 2.25 : 1.75}
                  />
                </span>
                {!isCreate && <span>{label}</span>}
                {isCreate && <span className="sr-only">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
