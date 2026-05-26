import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { CreatePostButton } from "@/components/post/create-post-launcher";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { getProfile } from "@/lib/auth";
import { getNotifications } from "@/lib/queries";
import type { Topic } from "@/lib/types";

/**
 * Public header — never reads cookies/headers, so it prerenders into the
 * static shell. The auth-aware bits (avatar, notifications bell, "Create
 * Post" button) live inside the `<Suspense>` below and stream in once
 * `getProfile()` resolves on the server.
 *
 * This is what unlocks the `Cache-Control: public, s-maxage=...` headers
 * configured in `next.config.ts`: the prerendered shell can be cached at
 * Vercel's edge, while signed-in personalisation streams in per request.
 */
export function SiteHeader({ topics = [] }: { topics?: Topic[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
        <MobileMenu topics={topics} />

        <Link
          href="/"
          aria-label="Lucky Cockroach Community — home"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-lg)] bg-accent text-on-accent">
            <BrandMark className="h-6 w-6" />
          </span>
          <span className="min-w-0 text-[14px] font-semibold leading-tight tracking-tight text-ink sm:text-[15px]">
            Lucky Cockroach
            <span className="block text-[11px] font-medium text-muted sm:text-[12px]">
              Community
            </span>
          </span>
        </Link>

        <form
          action="/search"
          className="relative mx-auto hidden w-full max-w-xl md:block"
        >
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            aria-label="Search posts, topics, and people"
            placeholder="Search posts, topics, people…"
            className="h-11 w-full rounded-full border border-border bg-surface-2 pl-11 pr-4 text-sm text-ink placeholder:text-muted focus:border-accent focus:bg-surface"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Suspense fallback={<AuthIslandFallback />}>
            <AuthIsland topics={topics} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/**
 * Signed-out fallback shown until the AuthIsland resolves. Same layout
 * footprint so the header doesn't reflow when the island arrives.
 */
function AuthIslandFallback() {
  return (
    <Link href="/login">
      <Button variant="secondary" className="h-10 rounded-full">
        Sign in
      </Button>
    </Link>
  );
}

/**
 * Dynamic island that resolves the current user and renders personalised
 * controls. Server-rendered, but isolated inside <Suspense> so the rest of
 * the page can stream / be prerendered without waiting on auth I/O.
 */
async function AuthIsland({ topics = [] }: { topics?: Topic[] }) {
  const profile = await getProfile();
  if (!profile) return <AuthIslandFallback />;

  const { items: notifications } = await getNotifications({ limit: 20 });
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <CreatePostButton topics={topics} userId={profile.id} />
      <NotificationsBell
        notifications={notifications}
        unread={unread}
        userId={profile.id}
      />
      <UserMenu profile={profile} />
    </>
  );
}
