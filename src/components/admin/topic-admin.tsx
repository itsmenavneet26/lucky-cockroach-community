"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Archive, ArchiveRestore, Pencil } from "lucide-react";
import {
  createTopic,
  updateTopic,
  toggleTopicArchive,
} from "@/lib/actions/admin";
import type { Topic } from "@/lib/types";

const input =
  "w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export function TopicAdmin({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submitCreate(formData: FormData) {
    setError("");
    startTransition(async () => {
      const res = await createTopic(formData);
      if (res.ok) router.refresh();
      else setError(res.error || "Failed.");
    });
  }

  function submitEdit(formData: FormData) {
    startTransition(async () => {
      const res = await updateTopic(formData);
      if (res.ok) {
        setEditing(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        action={submitCreate}
        className="rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-soft"
      >
        <h2 className="text-[15px] font-semibold text-ink">Create a topic</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input name="name" placeholder="Topic name" required className={input} />
          <input
            name="description"
            placeholder="Short description"
            className={input}
          />
          <button
            type="submit"
            disabled={pending}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius)] bg-accent px-4 text-[13px] font-semibold text-on-accent disabled:opacity-60"
          >
            <Plus size={15} /> Add
          </button>
        </div>
        {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
      </form>

      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
        {topics.map((t) => (
          <div key={t.id} className="border-b border-border p-4 last:border-0">
            {editing === t.id ? (
              <form action={submitEdit} className="flex flex-col gap-2">
                <input type="hidden" name="id" value={t.id} />
                <input name="name" defaultValue={t.name} required className={input} />
                <input
                  name="description"
                  defaultValue={t.description ?? ""}
                  className={input}
                />
                <textarea
                  name="rules"
                  defaultValue={t.rules ?? ""}
                  placeholder="Topic rules (optional)"
                  rows={2}
                  className={input}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="h-9 rounded-[var(--radius)] bg-accent px-4 text-[13px] font-semibold text-on-accent"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="h-9 rounded-[var(--radius)] px-3 text-[13px] font-medium text-ink-soft hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    {t.name}
                    {t.is_archived && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                        archived
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] text-muted">
                    /t/{t.slug} · {t.member_count} members
                  </p>
                  {t.description && (
                    <p className="mt-0.5 text-[13px] text-ink-soft">
                      {t.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setEditing(t.id)}
                    aria-label="Edit"
                    className="grid h-8 w-8 place-items-center rounded-[var(--radius)] text-ink-soft hover:bg-surface-2"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await toggleTopicArchive(t.id, !t.is_archived);
                        router.refresh();
                      })
                    }
                    aria-label={t.is_archived ? "Restore" : "Archive"}
                    className="grid h-8 w-8 place-items-center rounded-[var(--radius)] text-ink-soft hover:bg-surface-2"
                  >
                    {t.is_archived ? (
                      <ArchiveRestore size={15} />
                    ) : (
                      <Archive size={15} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
