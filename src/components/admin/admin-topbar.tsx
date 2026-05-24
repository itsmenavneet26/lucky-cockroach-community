import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { CreatePostButton } from "@/components/post/create-post-launcher";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { getProfile } from "@/lib/auth";
import { getNotifications, getTopics } from "@/lib/queries";

export async function AdminTopbar() {
  const profile = await getProfile();
  const [notifications, topics] = await Promise.all([
    profile ? getNotifications() : Promise.resolve([]),
    getTopics(),
  ]);
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <form action="/search" className="relative hidden w-full max-w-md md:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            type="search"
            placeholder="Search posts, topics, members…"
            className="h-10 w-full rounded-full border border-border bg-surface-2 pl-10 pr-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:bg-surface"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          {profile && (
            <NotificationsBell notifications={notifications} unread={unread} />
          )}
          <CreatePostButton topics={topics} userId={profile?.id ?? null} />
          <ThemeToggle />
          {profile && <UserMenu profile={profile} />}
        </div>
      </div>
    </header>
  );
}
