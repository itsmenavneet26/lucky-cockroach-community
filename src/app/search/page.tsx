import Link from "next/link";
import { Search as SearchIcon, Hash } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/feed/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import {
  searchPosts,
  searchTopics,
  searchPeople,
  postsByTag,
} from "@/lib/queries";
import { getProfile } from "@/lib/auth";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const profile = await getProfile();
  const signedIn = !!profile;

  // Tag view
  if (tag) {
    const posts = await postsByTag(tag);
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Posts tagged <span className="text-accent">#{tag}</span>
          </h1>
          {posts.length > 0 ? (
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                signedIn={signedIn}
                currentUserId={profile?.id ?? null}
              />
            ))
          ) : (
            <EmptyState
              icon={Hash}
              title="No posts with this tag"
              description={`Nothing has been tagged #${tag} yet.`}
            />
          )}
        </div>
      </AppShell>
    );
  }

  const query = (q ?? "").trim();
  const [posts, topics, people] = query
    ? await Promise.all([
        searchPosts(query),
        searchTopics(query),
        searchPeople(query),
      ])
    : [[], [], []];

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <form action="/search" className="relative">
          <SearchIcon
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Search posts, topics, people…"
            className="h-12 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-ink shadow-soft outline-none focus:border-accent"
          />
        </form>

        {!query ? (
          <EmptyState
            icon={SearchIcon}
            title="Search the community"
            description="Find posts, topics, and people across Lucky Cockroach Community."
          />
        ) : (
          <>
            {topics.length > 0 && (
              <section>
                <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
                  Topics
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {topics.map((t) => (
                    <Link
                      key={t.id}
                      href={`/t/${t.slug}`}
                      className="flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-soft hover:border-accent"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-[var(--radius)] bg-accent-soft text-accent">
                        <Hash size={16} />
                      </span>
                      <span>
                        <span className="block text-[14px] font-semibold text-ink">
                          {t.name}
                        </span>
                        <span className="text-[12px] text-muted">
                          {t.member_count.toLocaleString("en-IN")} members
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {people.length > 0 && (
              <section>
                <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
                  People
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {people.map((u) => (
                    <Link
                      key={u.id}
                      href={`/u/${u.username}`}
                      className="flex items-center gap-2.5 rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-soft hover:border-accent"
                    >
                      <Avatar
                        src={u.avatar_url}
                        name={u.display_name || u.username}
                        size={36}
                      />
                      <span>
                        <span className="block text-[14px] font-semibold text-ink">
                          {u.display_name || u.username}
                        </span>
                        <span className="text-[12px] text-muted">
                          @{u.username}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
                Posts
              </h2>
              {posts.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {posts.map((p) => (
                    <PostCard
                key={p.id}
                post={p}
                signedIn={signedIn}
                currentUserId={profile?.id ?? null}
              />
                  ))}
                </div>
              ) : topics.length === 0 && people.length === 0 ? (
                <EmptyState
                  icon={SearchIcon}
                  title="No results"
                  description={`Nothing matched "${query}". Try different words.`}
                />
              ) : (
                <p className="text-[13px] text-muted">No matching posts.</p>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
