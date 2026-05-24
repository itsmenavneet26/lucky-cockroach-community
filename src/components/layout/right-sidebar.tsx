import Link from "next/link";
import { BadgeCheck, Users, TrendingUp, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  getCommunityStats,
  getTrendingTags,
  getNewestMembers,
} from "@/lib/queries";
import { formatCount } from "@/lib/utils";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
      {children}
    </section>
  );
}

export async function RightSidebar() {
  const [stats, tags, members] = await Promise.all([
    getCommunityStats(),
    getTrendingTags(),
    getNewestMembers(),
  ]);

  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* Community */}
      <Card>
        <h2 className="flex items-center gap-1.5 text-[16px] font-semibold text-ink">
          Lucky Cockroach Community
          <BadgeCheck size={17} className="text-accent" />
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
          A space for India&apos;s students and youth to share what they&apos;re
          going through — and stand with people who understand.
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          {[
            ["Members", stats.members],
            ["Posts", stats.posts],
            ["Topics", stats.topics],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dd className="text-[15px] font-semibold text-ink">
                {formatCount(value as number)}
              </dd>
              <dt className="text-[11px] uppercase tracking-wide text-muted">
                {label}
              </dt>
            </div>
          ))}
        </dl>
        <Link
          href="/submit"
          className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-accent font-semibold text-on-accent hover:bg-accent-hover"
        >
          Share your story
        </Link>
      </Card>

      {/* Trending tags */}
      {tags.length > 0 && (
        <Card>
          <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
            <TrendingUp size={15} /> Trending tags
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {tags.map((tag) => (
              <li key={tag.slug}>
                <Link
                  href={`/search?tag=${tag.slug}`}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium text-ink hover:text-accent">
                    #{tag.slug}
                  </span>
                  <span className="text-[12px] text-muted">
                    {tag.count} {tag.count === 1 ? "post" : "posts"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Newest members */}
      {members.length > 0 && (
        <Card>
          <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
            <Sparkles size={15} /> Newest members
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {members.map((m) => {
              const name = m.display_name || m.username;
              return (
                <li key={m.id}>
                  <Link
                    href={`/u/${m.username}`}
                    className="flex items-center gap-2.5"
                  >
                    <Avatar src={m.avatar_url} name={name} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {name}
                      </span>
                      <span className="block text-[12px] text-muted">
                        @{m.username}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-accent">
          <Users size={15} /> Volunteer with us
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
          Have time or a skill to give? Join the groundwork behind the movement.
        </p>
        <Link
          href="/volunteer"
          className="mt-2 inline-block text-[13px] font-semibold text-accent underline underline-offset-2"
        >
          Become a volunteer →
        </Link>
      </Card>
    </div>
  );
}
