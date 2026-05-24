import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/feed/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSavedPosts } from "@/lib/queries";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Saved" };

export default async function SavedPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/saved");
  const posts = await getSavedPosts();

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Saved posts
          </h1>
          <p className="text-[13px] text-muted">
            Posts you&apos;ve bookmarked to come back to.
          </p>
        </div>
        {posts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                signedIn
                currentUserId={user.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Tap Save on any post and it'll show up here."
            action={{ label: "Browse the feed", href: "/" }}
          />
        )}
      </div>
    </AppShell>
  );
}
