import { notFound } from "next/navigation";
import { Users, PenLine, Hash } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { FeedTabs, type FeedKey } from "@/components/feed/feed-tabs";
import { PostCard } from "@/components/feed/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { JoinButton } from "@/components/topic/join-button";
import { getTopic, getFeedPosts } from "@/lib/queries";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const VALID: FeedKey[] = ["hot", "rising", "new"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) return { title: "Topic", robots: { index: false } };
  const description =
    (topic.description && topic.description.slice(0, 160)) ||
    `Posts and discussions in ${topic.name} on Lucky Cockroach Awaaz — India's student and youth community.`;
  const url = `/t/${topic.slug}`;
  return {
    title: topic.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${topic.name} · Lucky Cockroach Awaaz`,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic.name} · Lucky Cockroach Awaaz`,
      description,
    },
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort } = await searchParams;
  const [topic, profile] = await Promise.all([getTopic(slug), getProfile()]);
  if (!topic) notFound();

  const feed: FeedKey = VALID.includes(sort as FeedKey)
    ? (sort as FeedKey)
    : "hot";

  const [posts, joined] = await Promise.all([
    getFeedPosts({
      topicId: topic.id,
      sort: feed as "hot" | "rising" | "new",
    }),
    profile
      ? createClient()
          .then((supabase) =>
            supabase
              .from("topic_members")
              .select("id")
              .eq("user_id", profile.id)
              .eq("topic_id", topic.id)
              .maybeSingle(),
          )
          .then(({ data }) => !!data)
      : Promise.resolve(false),
  ]);

  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <div className="flex flex-col gap-4">
        <header className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] bg-accent-soft text-accent">
                <Hash size={20} />
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-ink">
                  {topic.name}
                </h1>
                <p className="mt-1 max-w-prose text-[14px] leading-relaxed text-ink-soft">
                  {topic.description}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
                  <Users size={13} />
                  {topic.member_count.toLocaleString("en-IN")} members
                </p>
              </div>
            </div>
            <JoinButton
              topicId={topic.id}
              slug={topic.slug}
              initialJoined={joined}
              signedIn={!!profile}
            />
          </div>
        </header>

        <FeedTabs current={feed} basePath={`/t/${slug}`} />

        {posts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                signedIn={!!profile}
                currentUserId={profile?.id ?? null}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PenLine}
            title="No posts in this topic yet"
            description={`Be the first to share something in ${topic.name}.`}
            action={{ label: "Create a post", href: "/submit" }}
          />
        )}
      </div>
    </AppShell>
  );
}
