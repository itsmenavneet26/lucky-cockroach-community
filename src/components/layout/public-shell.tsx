import { PublicSiteHeader } from "@/components/layout/public-site-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { getTopics } from "@/lib/queries";

/**
 * Cookie-free shell mirror of `<AppShell>` for cached static landing pages.
 *
 * Differences from `<AppShell>`:
 * - Uses `<PublicSiteHeader>` (no cookies) instead of `<SiteHeader>` (auth
 *   island reads cookies).
 * - Otherwise identical layout — same announcement bar, left sidebar
 *   (client component, no cookies), main content area, optional right
 *   sidebar.
 *
 * Required for routes that opt into `'use cache'` under Next 16
 * `cacheComponents: true`. Reading cookies anywhere in the tree of a
 * cached component is a build error.
 */
export async function PublicShell({
  children,
  rightSidebar,
}: {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}) {
  const topics = await getTopics();

  return (
    <div className="min-h-screen bg-bg">
      <AnnouncementBar />
      <PublicSiteHeader topics={topics} />
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <aside className="hidden shrink-0 lg:block">
          <div className="sticky top-[88px]">
            <LeftSidebar topics={topics} />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>

        {rightSidebar && (
          <aside className="hidden w-[332px] shrink-0 xl:block">
            <div className="sticky top-[88px]">{rightSidebar}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
