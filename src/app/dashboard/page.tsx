import { Suspense } from "react";
import Link from "next/link";
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
  Users,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { LineChart } from "@/components/admin/line-chart";
import { DonutChart } from "@/components/admin/donut-chart";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getFollowState,
  getNotifications,
  getSavedPosts,
  getUserBadges,
  getUserComments,
  getFeedPosts,
} from "@/lib/queries";
import { cn, formatCount, timeAgo } from "@/lib/utils";

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-[12px] font-medium text-accent underline underline-offset-2"
          >
            View all <ChevronRight size={13} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function trend(current: number, prior: number): string {
  if (prior === 0) return current > 0 ? "+100%" : "+0%";
  const pct = Math.round(((current - prior) / prior) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

/**
 * Stream the dashboard: shell paints immediately, the 16 queries below
 * resolve inside the Suspense boundary while the skeleton holds the layout.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardBody />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-7 w-48 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[var(--radius-xl)] border border-border bg-surface"
          />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-[var(--radius-xl)] border border-border bg-surface lg:col-span-2" />
        <div className="h-64 animate-pulse rounded-[var(--radius-xl)] border border-border bg-surface" />
      </div>
    </div>
  );
}

async function DashboardBody() {
  const profile = (await getProfile())!;
  const supabase = await createClient();
  const service = createServiceClient();

  // Per-request RSC render — wall-clock is intentional here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000).toISOString();
  const d14 = new Date(now - 14 * 86400000).toISOString();
  const d30 = new Date(now - 30 * 86400000).toISOString();

  const [
    follow,
    badges,
    recentPosts,
    recentComments,
    notifications,
    saved,
    postCount,
    commentCount,
    posts7,
    posts14,
    comments7,
    comments14,
    followers7,
    followers14,
    growthRows,
    topicRows,
  ] = await Promise.all([
    getFollowState(profile.id),
    getUserBadges(profile.id),
    getFeedPosts({ authorId: profile.id, sort: "new", limit: 4 }),
    getUserComments(profile.id, 4),
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
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .gte("created_at", d7),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .gte("created_at", d14)
      .lt("created_at", d7),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .gte("created_at", d7),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .gte("created_at", d14)
      .lt("created_at", d7),
    service
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profile.id)
      .gte("created_at", d7),
    service
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profile.id)
      .gte("created_at", d14)
      .lt("created_at", d7),
    supabase
      .from("posts")
      .select("created_at")
      .eq("author_id", profile.id)
      .gte("created_at", d30),
    supabase
      .from("posts")
      .select("topic_id, topics(name)")
      .eq("author_id", profile.id)
      .eq("is_removed", false),
  ]);

  // 30-day cumulative posts growth (per user)
  const created = (growthRows.data ?? [])
    .map((r) => new Date(r.created_at as string).getTime())
    .sort((a, b) => a - b);
  const baseline = (postCount.count ?? 0) - created.length;
  const growth: { date: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dayEnd = now - i * 86400000;
    const total = baseline + created.filter((t) => t <= dayEnd).length;
    growth.push({
      date: new Date(dayEnd).toISOString().slice(0, 10),
      total,
    });
  }

  // Top topics by your posts
  const topicCounts = new Map<string, number>();
  for (const row of (topicRows.data ?? []) as Array<{
    topics: { name: string } | { name: string }[] | null;
  }>) {
    const t = Array.isArray(row.topics) ? row.topics[0] : row.topics;
    const name = t?.name;
    if (!name) continue;
    topicCounts.set(name, (topicCounts.get(name) ?? 0) + 1);
  }
  const topTopics = Array.from(topicCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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

  const actions = [
    {
      href: "/submit",
      label: "New post",
      description: "Share a story or question",
      icon: PenSquare,
      primary: true,
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
      href: "/settings",
      label: "Settings",
      description: "Profile, account, privacy",
      icon: Settings,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={profile.avatar_url}
            name={name}
            size={56}
            className="border-2 border-surface shadow-soft"
          />
          <div>
            <p className="text-[12px] uppercase tracking-[0.14em] text-muted">
              {greeting}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {firstName}&apos;s Dashboard
            </h1>
            <p className="text-[13px] text-muted">
              @{profile.username} · your activity at a glance.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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

      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Sparkles}
          label="Karma"
          value={profile.karma}
          trendValue="+0%"
          trendNote="lifetime score"
        />
        <StatCard
          icon={FileText}
          label="Posts"
          value={postCount.count ?? 0}
          trendValue={trend(posts7.count ?? 0, posts14.count ?? 0)}
          trendNote="vs last 7 days"
        />
        <StatCard
          icon={MessageSquare}
          label="Comments"
          value={commentCount.count ?? 0}
          trendValue={trend(comments7.count ?? 0, comments14.count ?? 0)}
          trendNote="vs last 7 days"
        />
        <StatCard
          icon={Users}
          label="Followers"
          value={follow.followers}
          trendValue={trend(followers7.count ?? 0, followers14.count ?? 0)}
          trendNote="vs last 7 days"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Your posting activity">
          <p className="-mt-2 mb-1 text-[12px] text-muted">
            Cumulative posts over the last 30 days
          </p>
          <LineChart data={growth} />
        </Panel>
        <Panel title="Top topics you post in" href={`/u/${profile.username}`}>
          <DonutChart segments={topTopics} />
        </Panel>
      </div>

      {/* Quick actions */}
      <Panel title="Quick actions">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(({ href, label, description, icon: Icon, primary, badge }) => (
            <Link
              key={label}
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
      </Panel>

      {/* Three-column lower: posts / comments / side */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Recent posts" href={`/u/${profile.username}`}>
          {recentPosts.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              You haven&apos;t posted yet.{" "}
              <Link href="/submit" className="text-accent underline">
                Share something
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentPosts.slice(0, 4).map((p) => (
                <li key={p.id} className="py-2.5">
                  <Link
                    href={`/post/${p.id}`}
                    className="block hover:text-accent"
                  >
                    <p className="truncate text-[14px] font-medium text-ink">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {p.topic.name} · {timeAgo(p.created_at)} ·{" "}
                      {formatCount(p.score)} pts · {p.comment_count} comments
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent comments"
          href={`/u/${profile.username}?tab=comments`}
        >
          {recentComments.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              No comments yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
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
                      · {timeAgo(c.created_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel title="Notifications" href="/notifications">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {notifications.slice(0, 3).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      className={cn(
                        "flex items-start gap-2.5 py-2.5 hover:text-accent",
                        !n.is_read && "font-medium",
                      )}
                    >
                      <Avatar
                        src={n.actorAvatar}
                        name={n.actorName}
                        size={26}
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
          </Panel>

          <Panel title="Badges">
            {badges.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border-strong p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-muted">
                  <Award size={16} />
                </span>
                <p className="text-[12px] text-ink-soft">
                  Post, comment, and engage to earn badges.
                </p>
              </div>
            ) : (
              <ul className="flex flex-wrap gap-2">
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
          </Panel>
        </div>
      </div>
    </div>
  );
}
