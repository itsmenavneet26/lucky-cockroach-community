import Link from "next/link";
import { Hash, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { getTopics } from "@/lib/queries";

export const metadata = { title: "Explore topics" };

export default async function ExplorePage() {
  const topics = await getTopics();

  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Explore topics
          </h1>
          <p className="text-[13px] text-muted">
            Find the part of the community that fits what you&apos;re going
            through.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/t/${topic.slug}`}
              className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft transition-colors hover:border-accent"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-[var(--radius)] bg-accent-soft text-accent">
                  <Hash size={17} />
                </span>
                <h2 className="font-semibold text-ink">{topic.name}</h2>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                {topic.description}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted">
                <Users size={13} />
                {topic.member_count.toLocaleString("en-IN")} members
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
