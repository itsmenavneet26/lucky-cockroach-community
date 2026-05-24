import { UserAdmin } from "@/components/admin/user-admin";
import { getAllUsers } from "@/lib/queries";
import { getUser } from "@/lib/auth";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [users, user] = await Promise.all([getAllUsers(q), getUser()]);
  return (
    <UserAdmin users={users} query={q ?? ""} currentAdminId={user?.id ?? ""} />
  );
}
