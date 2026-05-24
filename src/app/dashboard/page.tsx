import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  Bell,
  Bookmark,
  FileText,
  MessageSquare,
  PenSquare,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  UserCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getFeedPosts,
  getFollowState,
  getNotifications,
  getSavedPosts,
  getUserBadges,
  getUserComments,
} from "@/lib/queries";
import { cn, formatCount, timeAgo } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/dashboard");

  const supabase = await createClient();
  const [
    follow,
    badges,
    recentPosts,
    recentComments,
    notifications,
    saved,
    postCount,
    commentCount,
  ] = await Promise.all([
    getFollowState(profile.id),
    getUserBadges(profile.id),
    getFeedPosts({ authorId: profile.id, sort: "new", limit: 4 }),
    getUserComments(profile.id),
    getNotifications(),
    getSavedPosts(),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .eq("is_removed", false),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .eq("is_removed", false),
  ]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const name = profile.display_name || profile.username;
  const firstName = name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Still up"
      : hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : hour < 22
      ? "Good evening"
      : "Good night";

  const stats = [
    {
      label: "Karma",
      value: formatCount(profile.karma),
      icon: Sparkles,
      href: `/u/${profile.username}`,
    },
    {
      label: "Posts",
      value: formatCount(postCount.count ?? 0),
      icon: FileText,
      href: `/u/${profile.username}`,
    },
    {
      label: "Comments",
      value: formatCount(commentCount.count ?? 0),
      icon: MessageSquare,
      href: `/u/${profile.username}?tab=comments`,
    },
    {
      label: "Followers",
      value: formatCount(follow.followers),
      icon: Users,
      href: `/u/${profile.username}`,
    },
  ];

  const actions = [
    {
      href: "/submit",
      label: "New post",
      description: "Share a story or question",
      icon: PenSquare,
      primary: true,
    },
    {
      href: `/u/${profile.username}`,
      label: "Your profile",
      description: "View your public page",
      icon: UserCircle,
    },
    {
      href: "/settings",
      label: "Settings",
      description: "Profile, account, privacy",
      icon: Settings,
    },
    {
      href: "/notifications",
      label: "Notifications",
      description: unreadCount > 0 ? `${unreadCount} unread` : "All caught up",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      href: "/saved",
      label: "Saved",
      description: `${saved.length} bookmarked`,
      icon: Bookmark,
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      description: "Top members this week",
      icon: TrendingUp,
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
          <div className="h-20 bg-gradient-to-br from-accent-soft via-surface-2 to-accent-soft" />
          <div className="px-5 pb-5">
            <div className="-mt-9 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-end gap-3">
                <Avatar
                  src={profile.avatar_url}
                  name={name}
                  size={72}
                  className="border-4 border-surface"
                />
                <div className="pb-1">
                  <p className="text-[12px] uppercase tracking-[0.14em] text-muted">
                    {greeting}
                  </p>
                  <h1 className="text-[22px] font-semibold tracking-tight text-ink">
                    {firstName}
                  </h1>
                  <p className="text-[13px] text-ink-soft">
                    @{profile.username} · joined{" "}
                    {new Date(profile.created_at).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pb-1">
                {profile.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="secondary" size="sm" className="rounded-full">
                      <Shield size={14} />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/submit">
                  <Button size="sm" className="rounded-full">
                    <PenSquare size={14} />
                    New post
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-1.5 rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft hover:border-border-strong"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
                  {label}
                </span>
                <Icon size={15} className="text-muted group-hover:text-accent" />
              </div>
              <span className="text-[22px] font-semibold tracking-tight text-ink">
                {value}
              </span>
            </Link>
          ))}
        </section>

        {/* Quick actions */}
        <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
          <h2 className="text-[15px] font-semibold text-ink">Quick actions</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map(({ href, label, description, icon: Icon, primary, badge }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-[var(--radius-lg)] border p-3 transition-colors",
                  primary
                    ? "border-accent/30 bg-accent-soft hover:border-accent/60"
                    : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)]",
                    primary
                      ? "bg-accent text-on-accent"
                      : "bg-surface-2 text-ink-soft group-hover:text-ink",
                  )}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-medium text-ink">
                      {label}
                    </p>
                    {badge !== undefined && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-on-accent">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[12px] text-ink-soft">
                    {description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Two-column: activity + side panels */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* Recent activity */}
          <section className="rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
            <header className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-[15px] font-semibold text-ink">Your activity</h2>
              <Link
                href={`/u/${profile.username}`}
                className="text-[12px] font-medium text-accent underline underline-offset-2"
              >
                View profile
              </Link>
            </header>

            <div className="px-5 py-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
                Recent posts
              </h3>
              {recentPosts.length === 0 ? (
                <p className="mt-2 text-[13px] text-ink-soft">
                  You haven&apos;t posted yet.{" "}
                  <Link href="/submit" className="text-accent underline underline-offset-2">
                    Share something
                  </Link>
                  .
                </p>
              ) : (
                <ul className="mt-2 flex flex-col divide-y divide-border">
                  {recentPosts.slice(0, 4).map((p) => (
                    <li key={p.id} className="py-2.5">
                      <Link
                        href={`/post/${p.id}`}
                        className="flex items-start justify-between gap-3 hover:text-accent"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-ink">
                            {p.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted">
                            {p.topic.name} · {timeAgo(p.created_at)} ·{" "}
                            {formatCount(p.score)} pts · {p.comment_count}{" "}
                            comments
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border px-5 py-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
                Recent comments
              </h3>
              {recentComments.length === 0 ? (
                <p className="mt-2 text-[13px] text-ink-soft">
                  No comments yet.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col divide-y divide-border">
                  {recentComments.slice(0, 4).map((c) => (
                    <li key={c.id} className="py-2.5">
                      <Link
                        href={c.post ? `/post/${c.post.id}` : "#"}
                        className="block hover:text-accent"
                      >
                        <p className="line-clamp-2 text-[13px] text-ink">
                          {c.body_text}
                        </p>
                        <p className="mt-1 text-[12px] text-muted">
                          on{" "}
                          <span className="text-ink-soft">
                            {c.post?.title ?? "[deleted]"}
                          </span>{" "}
                          · {timeAgo(c.created_at)} · {formatCount(c.score)} pts
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Side: notifications + saved + badges */}
          <div className="flex flex-col gap-4">
            <section className="rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
              <header className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-ink">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-on-accent">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <Link
                  href="/notifications"
                  className="text-[12px] font-medium text-accent underline underline-offset-2"
                >
                  See all
                </Link>
              </header>
              {notifications.length === 0 ? (
                <p className="px-5 py-4 text-[13px] text-ink-soft">
                  You&apos;re all caught up.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {notifications.slice(0, 4).map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        className={cn(
                          "flex items-start gap-2.5 px-5 py-3 hover:bg-surface-2",
                          !n.is_read && "bg-accent-soft/40",
                        )}
                      >
                        <Avatar
                          src={n.actorAvatar}
                          name={n.actorName}
                          size={28}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-ink">
                            <span className="font-medium">{n.actorName}</span>{" "}
                            <span className="text-ink-soft">{n.text}</span>
                          </p>
                          <p className="text-[11px] text-muted">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
              <header className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className="text-[15px] font-semibold text-ink">Saved</h2>
                <Link
                  href="/saved"
                  className="text-[12px] font-medium text-accent underline underline-offset-2"
                >
                  See all
                </Link>
              </header>
              {saved.length === 0 ? (
                <p className="px-5 py-4 text-[13px] text-ink-soft">
                  Nothing saved yet.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {saved.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/post/${p.id}`}
                        className="block px-5 py-3 hover:bg-surface-2"
                      >
                        <p className="truncate text-[13px] font-medium text-ink">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-muted">
                          {p.topic.name} · {timeAgo(p.created_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-ink">Badges</h2>
                <span className="text-[12px] text-muted">
                  {badges.length} earned
                </span>
              </div>
              {badges.length === 0 ? (
                <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border-strong p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">
                    <Award size={16} />
                  </span>
                  <p className="text-[12px] text-ink-soft">
                    Post, comment, and engage to start earning badges.
                  </p>
                </div>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {badges.slice(0, 8).map((b) => (
                    <li
                      key={b.badge.slug}
                      title={b.badge.description ?? b.badge.name}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[12px] text-ink-soft"
                    >
                      <Award size={12} className="text-accent" />
                      {b.badge.name}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
