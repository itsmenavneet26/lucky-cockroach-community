import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Reply, AtSign, UserPlus, Flame, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { MarkReadOnMount } from "@/components/notifications/mark-read";
import { DeleteNotificationButton } from "@/components/notifications/row-actions";
import { getNotifications } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { timeAgo, cn } from "@/lib/utils";

export const metadata = { title: "Notifications" };

const typeIcon: Record<string, typeof Bell> = {
  reply: Reply,
  mention: AtSign,
  follow: UserPlus,
  vote_milestone: Flame,
  mod_action: Shield,
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  if (!(await getUser())) redirect("/login?next=/notifications");
  const { cursor } = await searchParams;
  const { items: notifications, nextCursor } = await getNotifications({
    limit: 30,
    cursor: cursor ?? null,
  });
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <AppShell>
      <MarkReadOnMount hasUnread={hasUnread} />
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Notifications
        </h1>

        {notifications.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
            {notifications.map((n) => {
              const Icon = typeIcon[n.type] ?? Bell;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "group flex items-center gap-3 border-b border-border last:border-0 hover:bg-surface-2",
                    !n.is_read && "bg-accent-soft/40",
                  )}
                >
                  <Link
                    href={n.href}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3"
                  >
                    <div className="relative">
                      <Avatar src={n.actorAvatar} name={n.actorName} size={38} />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-on-accent">
                        <Icon size={11} />
                      </span>
                    </div>
                    <p className="min-w-0 flex-1 text-[14px] text-ink">
                      <span className="font-semibold">{n.actorName}</span>{" "}
                      <span className="text-ink-soft">{n.text}</span>
                    </p>
                    <span className="shrink-0 text-[12px] text-muted">
                      {timeAgo(n.created_at)}
                    </span>
                    {!n.is_read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                  </Link>
                  <div className="pr-3">
                    <DeleteNotificationButton id={n.id} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Replies, mentions, and follows will show up here."
          />
        )}

        {nextCursor && (
          <Link
            href={`/notifications?cursor=${encodeURIComponent(nextCursor)}`}
            className="self-center rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            Load older
          </Link>
        )}
      </div>
    </AppShell>
  );
}
