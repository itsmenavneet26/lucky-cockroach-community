import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminNavMobile, AdminPageTitle } from "@/components/admin/admin-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { requireAdmin } from "@/lib/queries";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await requireAdmin())) redirect("/");

  return (
    <div className="flex min-h-screen bg-bg">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 px-4 py-6 pb-[calc(64px+env(safe-area-inset-bottom))] sm:px-6 lg:pb-6">
          <div className="mb-4 lg:hidden">
            <AdminNavMobile />
          </div>
          <AdminPageTitle />
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
