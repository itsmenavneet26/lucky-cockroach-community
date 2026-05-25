"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Reply, AtSign, UserPlus, Flame, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { markAllNotificationsRead } from "@/lib/actions/notification";
import { createClient } from "@/lib/supabase/client";
import { timeAgo, cn } from "@/lib/utils";
import type { NotificationView } from "@/lib/queries";

const typeIcon: Record<string, typeof Bell> = {
  reply: Reply,
  mention: AtSign,
  follow: UserPlus,
  vote_milestone: Flame,
  mod_action: Shield,
};

export function NotificationsBell({
  notifications,
  unread,
  userId,
}: {
  notifications: NotificationView[];
  unread: number;
  userId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notif:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      markAllNotificationsRead().then(() => router.refresh());
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-pop">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[14px] font-semibold text-ink">Notifications</h2>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell size={24} className="mx-auto text-muted" />
              <p className="mt-2 text-[13px] text-muted">
                No notifications yet.
              </p>
            </div>
          ) : (
            <ul className="max-h-[400px] overflow-y-auto">
              {notifications.map((n) => {
                const Icon = typeIcon[n.type] ?? Bell;
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-2",
                        !n.is_read && "bg-accent-soft/40",
                      )}
                    >
                      <div className="relative">
                        <Avatar
                          src={n.actorAvatar}
                          name={n.actorName}
                          size={34}
                        />
                        <span className="absolute -bottom-1 -right-1 grid h-[18px] w-[18px] place-items-center rounded-full bg-accent text-on-accent">
                          <Icon size={10} />
                        </span>
                      </div>
                      <p className="min-w-0 flex-1 text-[13px] text-ink">
                        <span className="font-semibold">{n.actorName}</span>{" "}
                        <span className="text-ink-soft">{n.text}</span>
                      </p>
                      <span className="shrink-0 text-[11px] text-muted">
                        {timeAgo(n.created_at)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
