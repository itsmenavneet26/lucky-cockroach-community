import { getAuditLog } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

export default async function AdminAuditPage() {
  const entries = await getAuditLog();

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
      {entries.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] text-muted">
          No moderation or admin actions logged yet.
        </p>
      ) : (
        entries.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-[13px] last:border-0"
          >
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-ink-soft">
              {e.action}
            </span>
            <span className="flex-1 truncate text-ink-soft">
              by <span className="font-semibold text-ink">{e.actorName}</span>
              {e.target_type ? ` · ${e.target_type}` : ""}
            </span>
            <span className="shrink-0 text-[12px] text-muted">
              {timeAgo(e.created_at)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
