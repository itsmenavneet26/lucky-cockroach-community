"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Share2,
  Pencil,
  Trash2,
  Flag,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { reportContent } from "@/lib/actions/moderation";
import { deletePost, updatePost } from "@/lib/actions/post";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ReportReason } from "@/lib/types";

type Mode = "menu" | "edit" | "delete" | "report" | null;

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "misinformation", label: "False information" },
  { value: "self_harm", label: "Self-harm or someone in danger" },
  { value: "other", label: "Something else" },
];

export function PostMenu({
  postId,
  postPath,
  isOwner,
  signedIn,
  initialTitle,
  initialBodyText,
}: {
  postId: string;
  postPath: string;
  isOwner: boolean;
  signedIn: boolean;
  initialTitle: string;
  initialBodyText: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [pending, startTransition] = useTransition();

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (mode !== "menu") return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMode(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMode(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mode]);

  function onShare() {
    setMode(null);
    const url =
      typeof window !== "undefined" ? window.location.origin + postPath : postPath;
    if (!navigator.clipboard) {
      toast.error("Long-press the URL to copy.");
      return;
    }
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied."))
      .catch(() => toast.error("Couldn't copy the link."));
  }

  function onEditClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    setMode("edit");
  }

  function onDeleteClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    setMode("delete");
  }

  function onReportClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    setMode("report");
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="More post actions"
        aria-haspopup="menu"
        aria-expanded={mode === "menu"}
        onClick={() => setMode((m) => (m === "menu" ? null : "menu"))}
        className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
      >
        <MoreHorizontal size={17} />
      </button>

      {mode === "menu" && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-pop"
        >
          <MenuItem icon={Share2} label="Share" onClick={onShare} />
          {isOwner && (
            <>
              <MenuItem icon={Pencil} label="Edit" onClick={onEditClick} />
              <MenuItem
                icon={Trash2}
                label="Delete"
                tone="danger"
                onClick={onDeleteClick}
              />
            </>
          )}
          {!isOwner && (
            <MenuItem
              icon={Flag}
              label="Report"
              tone="danger"
              onClick={onReportClick}
            />
          )}
        </div>
      )}

      {mode === "edit" && (
        <EditDialog
          postId={postId}
          initialTitle={initialTitle}
          initialBodyText={initialBodyText}
          pending={pending}
          onClose={() => setMode(null)}
          onSave={(title, bodyText) =>
            startTransition(async () => {
              const res = await updatePost(postId, title, bodyText);
              if (res.ok) {
                toast.success("Post updated.");
                setMode(null);
                router.refresh();
              } else {
                toast.error(res.error || "Couldn't save your changes.");
              }
            })
          }
        />
      )}

      {mode === "delete" && (
        <ConfirmDialog
          title="Delete this post?"
          body="This permanently removes the post and all its comments. This can't be undone."
          confirmLabel="Delete post"
          pending={pending}
          onClose={() => setMode(null)}
          onConfirm={() =>
            startTransition(async () => {
              const res = await deletePost(postId);
              // deletePost redirects on success → we won't reach here on ok.
              if (!res.ok) {
                toast.error(res.error || "Couldn't delete the post.");
                setMode(null);
              }
            })
          }
        />
      )}

      {mode === "report" && (
        <ReportDialog
          postId={postId}
          pending={pending}
          onClose={() => setMode(null)}
          onSubmit={(reason, details) =>
            startTransition(async () => {
              const res = await reportContent("post", postId, reason, details);
              if (res.ok) {
                toast.success("Thanks — our moderators will review this.");
                setMode(null);
              } else {
                toast.error(res.error || "Couldn't submit the report.");
              }
            })
          }
        />
      )}
    </div>
  );
}

// ── menu items ─────────────────────────────────────────────────

function MenuItem({
  icon: Icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: typeof Share2;
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium hover:bg-surface-2",
        tone === "danger" ? "text-danger" : "text-ink",
      )}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

// ── dialogs ────────────────────────────────────────────────────

function DialogShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  // Close on Escape; the backdrop click is handled by the overlay div.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-pop"
      >
        {children}
      </div>
    </div>
  );
}

function EditDialog({
  postId: _postId,
  initialTitle,
  initialBodyText,
  pending,
  onClose,
  onSave,
}: {
  postId: string;
  initialTitle: string;
  initialBodyText: string;
  pending: boolean;
  onClose: () => void;
  onSave: (title: string, bodyText: string) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [bodyText, setBodyText] = useState(initialBodyText);

  return (
    <DialogShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-ink">Edit post</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2"
        >
          <X size={16} />
        </button>
      </div>
      <label className="mt-3 block text-[13px] font-semibold text-ink">
        Title
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
        className="mt-1.5 h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-accent"
      />
      <label className="mt-3 block text-[13px] font-semibold text-ink">
        Body
      </label>
      <textarea
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        rows={6}
        maxLength={20000}
        className="mt-1.5 w-full resize-y rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
      />
      <p className="mt-1 text-[11px] text-muted">
        Rich formatting can&apos;t be edited inline yet — your original layout will
        be replaced by this plain text.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="h-10 rounded-[var(--radius)] px-4 text-[13px] font-semibold text-ink-soft hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(title, bodyText)}
          disabled={pending || title.trim().length < 5}
          className="flex h-10 items-center gap-1.5 rounded-[var(--radius)] bg-accent px-4 text-[13px] font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {pending && <Loader2 size={13} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </DialogShell>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  pending,
  onClose,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogShell onClose={onClose}>
      <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-[14px] text-ink-soft">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="h-10 rounded-[var(--radius)] px-4 text-[13px] font-semibold text-ink-soft hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={pending}
          className="flex h-10 items-center gap-1.5 rounded-[var(--radius)] bg-danger px-4 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending && <Loader2 size={13} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </DialogShell>
  );
}

function ReportDialog({
  postId: _postId,
  pending,
  onClose,
  onSubmit,
}: {
  postId: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
}) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");

  return (
    <DialogShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-ink">Report post</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2"
        >
          <X size={16} />
        </button>
      </div>
      <p className="mt-1 text-[13px] text-ink-soft">
        Tell us what&apos;s wrong. Reports are confidential.
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {REPORT_REASONS.map((r) => (
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
            {reason === r.value && (
              <Check size={13} className="ml-auto text-accent" />
            )}
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
      <button
        onClick={() => onSubmit(reason, details)}
        disabled={pending}
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius)] bg-accent font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60"
      >
        {pending && <Loader2 size={13} className="animate-spin" />}
        Submit report
      </button>
    </DialogShell>
  );
}
