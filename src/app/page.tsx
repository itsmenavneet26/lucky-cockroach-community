import { PenLine } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { HeroBanner } from "@/components/feed/hero-banner";
import { ComposerLauncher } from "@/components/post/create-post-launcher";
import { FeedTabs, type FeedKey } from "@/components/feed/feed-tabs";
import { PostCard } from "@/components/feed/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getProfile } from "@/lib/auth";
import {
  getSettings,
  getFeedPosts,
  getFollowingFeed,
  getTopics,
} from "@/lib/queries";

const VALID: FeedKey[] = ["hot", "rising", "new", "following"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const feed: FeedKey = VALID.includes(sort as FeedKey)
    ? (sort as FeedKey)
    : "hot";

  const [profile, settings, topics] = await Promise.all([
    getProfile(),
    getSettings(),
    getTopics(),
  ]);
  const posts =
    feed === "following"
      ? await getFollowingFeed()
      : await getFeedPosts({ sort: feed });

  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <div className="flex flex-col gap-4">
        <HeroBanner hero={settings.home_hero} />
        <ComposerLauncher profile={profile} topics={topics} />
        <FeedTabs current={feed} />

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
        ) : feed === "following" ? (
          <EmptyState
            icon={PenLine}
            title="Your following feed is quiet"
            description="Join some topics to see posts from the parts of the community you care about."
            action={{ label: "Explore topics", href: "/explore" }}
          />
        ) : (
          <EmptyState
            icon={PenLine}
            title="No posts yet"
            description="Be the first to share what you're going through with the community."
            action={{ label: "Create a post", href: "/submit" }}
          />
        )}
      </div>
    </AppShell>
  );
}
