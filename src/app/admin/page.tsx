import Link from "next/link";
import {
  Users,
  FileText,
  Flag,
  HeartHandshake,
  Hash,
  ChevronRight,
  Megaphone,
  ScrollText,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { LineChart } from "@/components/admin/line-chart";
import { DonutChart } from "@/components/admin/donut-chart";
import { QuickVolunteerActions } from "@/components/admin/quick-volunteer-actions";
import { Avatar } from "@/components/ui/avatar";
import { getDashboardData } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

const reasonLabel: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  hate: "Hate speech",
  misinformation: "Misinformation",
  self_harm: "Self-harm concern",
  other: "Other",
};

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

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const { stats } = data;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Admin Dashboard
        </h1>
        <p className="text-[13px] text-muted">
          Overview and management of your community.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Members"
          value={stats.members}
          trendValue={`${stats.membersTrend >= 0 ? "+" : ""}${stats.membersTrend}%`}
          trendNote="vs last 7 days"
        />
        <StatCard
          icon={FileText}
          label="Posts"
          value={stats.posts}
          trendValue={`${stats.postsTrend >= 0 ? "+" : ""}${stats.postsTrend}%`}
          trendNote="vs last 7 days"
        />
        <StatCard
          icon={Flag}
          label="Open reports"
          value={stats.openReports}
          trendValue={`+${stats.reportsNew}`}
          trendNote="new this week"
        />
        <StatCard
          icon={HeartHandshake}
          label="Pending volunteers"
          value={stats.pendingVolunteers}
          trendValue={`+${stats.volunteersNew}`}
          trendNote="new this week"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Community growth">
          <p className="-mt-2 mb-1 text-[12px] text-muted">
            Total members over the last 30 days
          </p>
          <LineChart data={data.growth} />
        </Panel>
        <Panel title="Top topics by activity" href="/admin/topics">
          <DonutChart segments={data.topTopics} />
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Recent reports" href="/admin/reports">
          {data.recentReports.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              No reports — all clear.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.recentReports.map((r) => (
                <li key={r.id} className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius)] bg-accent-soft text-accent">
                    <Flag size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">
                      {reasonLabel[r.reason] ?? r.reason} ·{" "}
                      <span className="capitalize text-ink-soft">
                        {r.targetType}
                      </span>
                    </p>
                    <p className="text-[12px] text-muted">
                      by {r.reporterName} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium capitalize text-ink-soft">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pending volunteers" href="/admin/volunteers">
          {data.pendingVolunteers.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              No pending applications.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.pendingVolunteers.map((v) => (
                <li key={v.id} className="flex items-center gap-2.5">
                  <Avatar name={v.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {v.name}
                    </p>
                    <p className="text-[12px] text-muted">
                      applied {timeAgo(v.createdAt)}
                    </p>
                  </div>
                  <QuickVolunteerActions id={v.id} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel title="Quick actions">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New topic", href: "/admin/topics", icon: Hash },
                { label: "Review reports", href: "/admin/reports", icon: Flag },
                { label: "Volunteers", href: "/admin/volunteers", icon: HeartHandshake },
                { label: "Appearance", href: "/admin/appearance", icon: Megaphone },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2.5 text-[12px] font-medium text-ink-soft hover:border-accent hover:text-accent"
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Latest activity" href="/admin/audit">
            {data.recentActivity.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted">
                No activity logged yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {data.recentActivity.map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-soft">
                      <ScrollText size={13} />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[12px] text-ink-soft">
                      <span className="font-mono text-ink">{a.action}</span> ·{" "}
                      {a.actorName}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted">
                      {timeAgo(a.createdAt)}
                    </span>
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
