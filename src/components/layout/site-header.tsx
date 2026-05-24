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

export async function SiteHeader({ topics = [] }: { topics?: Topic[] }) {
  const profile = await getProfile();
  const notifications = profile ? await getNotifications() : [];
  const unread = notifications.filter((n) => !n.is_read).length;

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
          <span className="hidden leading-none sm:block">
            <span className="block text-[16px] font-semibold tracking-[0.1em] text-ink">
              LUCKY
            </span>
            <span className="block text-[10px] font-medium tracking-[0.3em] text-muted">
              COCKROACH
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
          <CreatePostButton topics={topics} userId={profile?.id ?? null} />

          {profile && (
            <NotificationsBell notifications={notifications} unread={unread} />
          )}

          <ThemeToggle />

          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <Link href="/login">
              <Button variant="secondary" className="h-10 rounded-full">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
