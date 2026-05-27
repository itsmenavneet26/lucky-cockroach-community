import Link from "next/link";
import { Search } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import type { Topic } from "@/lib/types";

/**
 * Cookie-free version of `<SiteHeader>` for use on cached landing pages.
 *
 * The full `<SiteHeader>` mounts an `<AuthIsland>` that reads cookies to
 * render the user's avatar / notifications. Inside Next 16
 * `cacheComponents` that's forbidden — `cookies()` may not be called from
 * any descendant of a `'use cache'` tree, even behind `<Suspense>`. This
 * variant skips the auth island entirely and always shows the
 * "Sign in" button, which is appropriate for marketing pages
 * (`/about`, `/guidelines`, `/mental-health`, `/scholarship`).
 *
 * Signed-in users on these pages can navigate via the mobile menu or
 * left-sidebar links; the auth-aware header returns on the next dynamic
 * route they visit.
 */
export function PublicSiteHeader({ topics = [] }: { topics?: Topic[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
        <MobileMenu topics={topics} />

        <Link
          href="/"
          aria-label="Lucky Cockroach Awaaz — home"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-lg)] bg-accent text-on-accent">
            <BrandMark className="h-6 w-6" />
          </span>
          <span className="min-w-0 text-[14px] font-semibold leading-tight tracking-tight text-ink sm:text-[15px]">
            Lucky Cockroach
            <span className="block text-[12px] font-semibold text-accent sm:text-[13px]">
              Awaaz
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
          <Link href="/login">
            <Button variant="secondary" className="h-10 rounded-full">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
