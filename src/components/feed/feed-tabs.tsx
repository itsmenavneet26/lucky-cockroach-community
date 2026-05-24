import Link from "next/link";
import { Flame, TrendingUp, Clock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeedKey = "hot" | "rising" | "new" | "following";

const tabs: { key: FeedKey; label: string; icon: typeof Flame }[] = [
  { key: "hot", label: "For you", icon: Flame },
  { key: "rising", label: "Trending", icon: TrendingUp },
  { key: "new", label: "Recent", icon: Clock },
  { key: "following", label: "Following", icon: UserCheck },
];

export function FeedTabs({
  current,
  basePath = "/",
}: {
  current: FeedKey;
  basePath?: string;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-[var(--radius-xl)] border border-border bg-surface p-1.5 shadow-soft">
      {tabs.map(({ key, label, icon: Icon }) => {
        const active = current === key;
        const href = key === "hot" ? basePath : `${basePath}?sort=${key}`;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium",
              active
                ? "bg-accent-soft text-accent"
                : "text-ink-soft hover:bg-surface-2",
            )}
          >
            <Icon size={15} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
