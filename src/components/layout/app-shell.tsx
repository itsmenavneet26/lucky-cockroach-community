import { SiteHeader } from "@/components/layout/site-header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { getTopics } from "@/lib/queries";

export async function AppShell({
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
      <SiteHeader topics={topics} />
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-6">
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
      <MobileBottomNav />
    </div>
  );
}
