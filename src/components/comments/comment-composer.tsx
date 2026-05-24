"use client";

import { useState, useTransition } from "react";

export function CommentComposer({
  onSubmit,
  placeholder = "Add a comment…",
  submitLabel = "Comment",
  initialValue = "",
  autoFocus = false,
  onCancel,
}: {
  onSubmit: (text: string) => Promise<{ ok: boolean; error?: string }>;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [text, setText] = useState(initialValue);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await onSubmit(text);
      if (res.ok) {
        setText("");
        onCancel?.();
      } else {
        setError(res.error || "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
        className="w-full resize-y rounded-[var(--radius)] border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
      />
      {error && <p className="text-[12px] text-danger">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={pending || !text.trim()}
          className="h-9 rounded-full bg-accent px-4 text-[13px] font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Posting…" : submitLabel}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="h-9 rounded-full px-3 text-[13px] font-medium text-ink-soft hover:bg-surface-2"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
