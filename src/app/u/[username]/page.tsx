import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  TrendingUp,
  ShieldCheck,
  Award,
  Sparkles,
  MessageSquare,
  FileText,
  MapPin,
  Heart,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/feed/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/profile/follow-button";
import { Button } from "@/components/ui/button";
import {
  getProfileByUsername,
  getFeedPosts,
  getUserComments,
  getUserBadges,
  getFollowState,
} from "@/lib/queries";
import { getProfile } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

const badgeIcons: Record<string, typeof Star> = {
  star: Star,
  "trending-up": TrendingUp,
  "shield-check": ShieldCheck,
  award: Award,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile)
    return { title: `@${username}`, robots: { index: false } };
  const displayName = profile.display_name || `@${profile.username}`;
  const bio =
    (profile.bio && profile.bio.slice(0, 160)) ||
    `Profile of ${displayName} on Lucky Cockroach Awaaz — posts, comments, and contributions to India's student and youth community.`;
  const url = `/u/${profile.username}`;
  return {
    title: `${displayName} (@${profile.username})`,
    description: bio,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      title: `${displayName} (@${profile.username})`,
      description: bio,
      url,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${displayName} (@${profile.username})`,
      description: bio,
    },
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab } = await searchParams;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const viewer = await getProfile();
  const isOwn = viewer?.id === profile.id;
  const activeTab = tab === "comments" ? "comments" : "posts";

  const [follow, badges, posts, comments] = await Promise.all([
    getFollowState(profile.id),
    getUserBadges(profile.id),
    activeTab === "posts"
      ? getFeedPosts({ authorId: profile.id, sort: "new" })
      : Promise.resolve([]),
    activeTab === "comments"
      ? getUserComments(profile.id)
      : Promise.resolve([]),
  ]);

  const name = profile.display_name || profile.username;

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <header className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
          <div className="h-28 bg-gradient-to-br from-accent-soft via-surface-2 to-accent-soft" />
          <div className="px-5 pb-5">
            <div className="-mt-10 flex items-end justify-between">
              <Avatar
                src={profile.avatar_url}
                name={name}
                size={80}
                className="border-4 border-surface"
              />
              {isOwn ? (
                <Link href="/settings">
                  <Button variant="secondary" size="sm" className="rounded-full">
                    Edit profile
                  </Button>
                </Link>
              ) : (
                <FollowButton
                  targetId={profile.id}
                  initialFollowing={follow.viewerFollows}
                  signedIn={!!viewer}
                  revalidate={`/u/${username}`}
                />
              )}
            </div>
            <h1 className="mt-3 flex flex-wrap items-baseline gap-x-2 text-xl font-semibold tracking-tight text-ink">
              {name}
              {profile.pronouns && (
                <span className="text-[13px] font-normal text-muted">
                  ({profile.pronouns})
                </span>
              )}
            </h1>
            <p className="text-[13px] text-muted">@{profile.username}</p>

            {profile.bio && (
              <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-ink-soft">
                {profile.bio}
              </p>
            )}

            {(profile.location || profile.status) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-muted" />
                    {profile.location}
                  </span>
                )}
                {profile.status && (
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-muted" />
                    {profile.status}
                  </span>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-soft">
              <span>
                <strong className="text-ink">{profile.karma}</strong> karma
              </span>
              <span>
                <strong className="text-ink">{follow.followers}</strong>{" "}
                followers
              </span>
              <span>
                <strong className="text-ink">{follow.following}</strong>{" "}
                following
              </span>
              <span className="text-muted">
                Joined {timeAgo(profile.created_at)}
              </span>
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">
                  <Heart size={12} /> Cares about
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[12px] font-medium text-ink-soft"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {badges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {badges.map((b) => {
                  const Icon = badgeIcons[b.badge.icon ?? ""] ?? Sparkles;
                  return (
                    <span
                      key={b.badge.slug}
                      title={b.badge.description ?? ""}
                      className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent"
                    >
                      <Icon size={13} />
                      {b.badge.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        <div className="flex gap-1 rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-soft">
          {[
            { key: "posts", label: "Posts", icon: FileText },
            { key: "comments", label: "Comments", icon: MessageSquare },
          ].map(({ key, label, icon: Icon }) => (
            <Link
              key={key}
              href={`/u/${username}${key === "comments" ? "?tab=comments" : ""}`}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] py-2 text-[13px] font-medium",
                activeTab === key
                  ? "bg-accent-soft text-accent"
                  : "text-ink-soft hover:bg-surface-2",
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {activeTab === "posts" ? (
          posts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  signedIn={!!viewer}
                  currentUserId={viewer?.id ?? null}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No posts yet"
              description={`${isOwn ? "You haven't" : name + " hasn't"} posted anything yet.`}
            />
          )
        ) : comments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {comments.map((c) => (
              <Link
                key={c.id}
                href={`/post/${c.post?.id}`}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-soft hover:border-accent"
              >
                <p className="text-[12px] text-muted">
                  on{" "}
                  <span className="font-medium text-ink-soft">
                    {c.post?.title ?? "a post"}
                  </span>{" "}
                  · {timeAgo(c.created_at)}
                </p>
                <p className="mt-1 line-clamp-3 text-[14px] text-ink">
                  {c.body_text}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="No comments yet"
            description={`${isOwn ? "You haven't" : name + " hasn't"} commented anywhere yet.`}
          />
        )}
      </div>
    </AppShell>
  );
}
