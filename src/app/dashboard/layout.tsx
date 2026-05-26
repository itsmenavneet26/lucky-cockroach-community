import { redirect } from "next/navigation";
import { UserSidebar } from "@/components/user-dashboard/user-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { getProfile } from "@/lib/auth";
import { getTopics } from "@/lib/queries";

export const metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/dashboard");

  const topics = await getTopics();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteHeader topics={topics} />
      <div className="flex min-w-0 flex-1">
        <UserSidebar username={profile.username} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-[calc(64px+env(safe-area-inset-bottom))] sm:px-6 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
