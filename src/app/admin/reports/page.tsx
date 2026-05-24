import Link from "next/link";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ModReportActions } from "@/components/moderation/mod-report-actions";
import { getModReports } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

const reasonLabel: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  hate: "Hate speech",
  misinformation: "Misinformation",
  self_harm: "Self-harm concern",
  other: "Other",
};

export default async function AdminReportsPage() {
  const reports = await getModReports();

  return (
    <div className="flex flex-col gap-3">
      {reports.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nothing to review"
          description="There are no open reports right now. Good news."
        />
      ) : (
        reports.map((r) => (
          <div
            key={r.id}
            className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft"
          >
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-semibold text-accent">
                {reasonLabel[r.reason] ?? r.reason}
              </span>
              <span className="capitalize">{r.targetType} reported</span>
              <span aria-hidden>·</span>
              <span>by {r.reporterName}</span>
              <span aria-hidden>·</span>
              <span>{timeAgo(r.created_at)}</span>
              {r.targetRemoved && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium">
                  already removed
                </span>
              )}
            </div>

            <p className="mt-2 line-clamp-3 rounded-[var(--radius)] bg-surface-2 px-3 py-2 text-[14px] text-ink">
              {r.targetExcerpt}
            </p>

            {r.details && (
              <p className="mt-2 text-[13px] text-ink-soft">
                <span className="font-medium text-ink">Reporter note:</span>{" "}
                {r.details}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-3">
              <Link
                href={r.targetHref}
                className="flex items-center gap-1.5 text-[13px] font-medium text-accent underline underline-offset-2"
              >
                <ExternalLink size={14} /> View in context
              </Link>
              <ModReportActions
                reportId={r.id}
                targetType={r.targetType}
                targetId={r.targetId}
                postId={r.postId}
                alreadyRemoved={r.targetRemoved}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
