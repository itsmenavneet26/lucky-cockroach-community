import Link from "next/link";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { Avatar } from "@/components/ui/avatar";
import { getLeaderboard } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leaderboard", alternates: { canonical: "/leaderboard" } };
export const revalidate = 300;

export default async function LeaderboardPage() {
  const members = await getLeaderboard();

  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink">
            <Trophy size={20} className="text-accent" />
            Leaderboard
          </h1>
          <p className="text-[13px] text-muted">
            The members giving the most to the community, ranked by karma.
          </p>
        </div>

        <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
          {members.map((m, i) => {
            const name = m.display_name || m.username;
            const rank = i + 1;
            return (
              <Link
                key={m.id}
                href={`/u/${m.username}`}
                className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-2"
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold",
                    rank <= 3
                      ? "bg-accent text-on-accent"
                      : "bg-surface-2 text-ink-soft",
                  )}
                >
                  {rank}
                </span>
                <Avatar src={m.avatar_url} name={name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">
                    {name}
                  </p>
                  <p className="text-[12px] text-muted">@{m.username}</p>
                </div>
                <span className="text-[14px] font-semibold text-accent">
                  {m.karma}
                  <span className="ml-1 text-[12px] font-normal text-muted">
                    karma
                  </span>
                </span>
              </Link>
            );
          })}
          {members.length === 0 && (
            <p className="px-4 py-10 text-center text-[13px] text-muted">
              No members ranked yet.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
