"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

type FieldExtras = {
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
};

export function AuthField({
  label,
  icon: Icon,
  error,
  hint,
  ...props
}: FieldExtras & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const errorId = `${id}-err`;
  const hintId = `${id}-hint`;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </span>
      <span
        className={`flex items-center rounded-[var(--radius)] border bg-surface-2 focus-within:border-accent ${
          error ? "border-danger" : "border-border"
        }`}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center text-muted">
          <Icon size={17} />
        </span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
          className="h-11 w-full bg-transparent pr-3 text-sm text-ink outline-none placeholder:text-muted"
        />
      </span>
      {error ? (
        <span id={errorId} className="mt-1 block text-[12px] text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="mt-1 block text-[12px] text-ink-soft">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function PasswordField({
  label = "Password",
  error,
  hint,
  ...props
}: {
  label?: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const id = useId();
  const errorId = `${id}-err`;
  const hintId = `${id}-hint`;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">
        {label}
      </span>
      <span
        className={`flex items-center rounded-[var(--radius)] border bg-surface-2 focus-within:border-accent ${
          error ? "border-danger" : "border-border"
        }`}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center text-muted">
          <LockGlyph />
        </span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
          type={show ? "text" : "password"}
          className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="grid h-11 w-11 shrink-0 place-items-center text-muted hover:text-ink"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
      {error ? (
        <span id={errorId} className="mt-1 block text-[12px] text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="mt-1 block text-[12px] text-ink-soft">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/** Inline banner for whole-form errors and success notices. */
export function FormBanner({
  tone = "error",
  children,
}: {
  tone?: "error" | "notice" | "success";
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    error:
      "border-danger/40 bg-danger/10 text-danger",
    notice: "border-accent/30 bg-accent-soft text-ink",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-[var(--radius)] border px-3 py-2 text-[13px] ${styles[tone]}`}
    >
      {children}
    </p>
  );
}

function LockGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
