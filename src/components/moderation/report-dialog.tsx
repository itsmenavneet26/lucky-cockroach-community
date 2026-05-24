"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, X, CheckCircle2 } from "lucide-react";
import { reportContent } from "@/lib/actions/moderation";
import type { ReportReason, TargetType } from "@/lib/types";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "misinformation", label: "False information" },
  { value: "self_harm", label: "Self-harm or someone in danger" },
  { value: "other", label: "Something else" },
];

export function ReportDialog({
  targetType,
  targetId,
  signedIn,
}: {
  targetType: TargetType;
  targetId: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await reportContent(targetType, targetId, reason, details);
      if (res.ok) setDone(true);
      else setError(res.error || "Could not submit report.");
    });
  }

  return (
    <>
      <button
        onClick={() => (signedIn ? setOpen(true) : router.push("/login"))}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-danger"
      >
        <Flag size={14} /> Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-pop">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-ink">
                Report {targetType}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2"
              >
                <X size={16} />
              </button>
            </div>

            {done ? (
              <div className="py-6 text-center">
                <CheckCircle2 size={32} className="mx-auto text-accent" />
                <p className="mt-2 text-[14px] text-ink">
                  Thank you — our moderators will review this.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-4 h-9 rounded-full bg-accent px-5 text-[13px] font-semibold text-on-accent"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="mt-1 text-[13px] text-ink-soft">
                  Tell us what&apos;s wrong. Reports are confidential.
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius)] border border-border px-3 py-2 text-[13px] text-ink has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
                    >
                      <input
                        type="radio"
                        name="reason"
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-[var(--accent)]"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Add any detail (optional)"
                  className="mt-3 w-full resize-none rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                />
                {error && (
                  <p className="mt-2 text-[12px] text-danger">{error}</p>
                )}
                <button
                  onClick={submit}
                  disabled={pending}
                  className="mt-3 h-10 w-full rounded-[var(--radius)] bg-accent font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60"
                >
                  {pending ? "Submitting…" : "Submit report"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
