import { redirect } from "next/navigation";
import { UserSidebar } from "@/components/user-dashboard/user-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { getProfile } from "@/lib/auth";

export const metadata = { title: "Dashboard" };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/dashboard");

  return (
    <div className="flex min-h-screen bg-bg">
      <UserSidebar username={profile.username} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
