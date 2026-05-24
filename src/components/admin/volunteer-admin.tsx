"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Mail, Phone, MapPin } from "lucide-react";
import { setVolunteerStatus } from "@/lib/actions/admin";
import { contributionAreas } from "@/lib/volunteer";
import { timeAgo, cn } from "@/lib/utils";
import type { VolunteerApplication } from "@/lib/queries";

const STATUSES = ["pending", "reviewing", "accepted", "declined"] as const;
const areaName = (id: string) =>
  contributionAreas.find((a) => a.id === id)?.name ?? id;

const statusColor: Record<string, string> = {
  pending: "bg-surface-2 text-ink-soft",
  reviewing: "bg-accent-soft text-accent",
  accepted: "bg-[color-mix(in_srgb,var(--positive)_18%,transparent)] text-positive",
  declined: "bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-danger",
};

export function VolunteerAdmin({
  applications,
}: {
  applications: VolunteerApplication[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function changeStatus(id: string, status: (typeof STATUSES)[number]) {
    startTransition(async () => {
      await setVolunteerStatus(id, status);
      router.refresh();
    });
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface py-16 text-center text-[14px] text-muted shadow-soft">
        No volunteer applications yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((a) => {
        const expanded = open === a.id;
        return (
          <div
            key={a.id}
            className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft"
          >
            <button
              onClick={() => setOpen(expanded ? null : a.id)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink">
                  {a.full_name}
                </p>
                <p className="text-[12px] text-muted">
                  {a.location} · applied {timeAgo(a.created_at)}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                  statusColor[a.status],
                )}
              >
                {a.status}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "text-muted transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </button>

            {expanded && (
              <div className="border-t border-border p-4">
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} /> {a.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} /> {a.phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {a.location}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">
                    Contribution areas
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {a.areas.map((id) => (
                      <span
                        key={id}
                        className="rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent"
                      >
                        {areaName(id)}
                      </span>
                    ))}
                  </div>
                </div>

                {a.skills && (
                  <Detail label="Skills" value={a.skills} />
                )}
                {a.availability && (
                  <Detail label="Availability" value={a.availability} />
                )}
                {a.experience && (
                  <Detail label="Experience" value={a.experience} />
                )}
                <Detail label="Motivation" value={a.motivation} />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-semibold text-ink">
                    Set status:
                  </span>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(a.id, s)}
                      className={cn(
                        "rounded-full px-3 py-1 text-[12px] font-semibold capitalize",
                        a.status === s
                          ? "bg-accent text-on-accent"
                          : "border border-border-strong text-ink-soft hover:bg-surface-2",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-ink">
        {value}
      </p>
    </div>
  );
}
