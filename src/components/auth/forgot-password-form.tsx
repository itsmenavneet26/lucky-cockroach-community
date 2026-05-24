"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  requestPasswordReset,
  type AuthState,
} from "@/lib/actions/auth";
import {
  AuthField,
  FormBanner,
} from "@/components/auth/auth-fields";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.notice) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-ink">
          Check your email
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          {state.notice}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-[14px] font-medium text-accent underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/login"
        className="flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to sign in
      </Link>

      <div className="mt-8">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">
          Reset your password
        </h1>
        <div className="mt-3 h-1 w-12 rounded-full bg-accent" />
        <p className="mt-3 text-[14px] text-ink-soft">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </div>

      <form action={action} className="mt-7 flex flex-col gap-4">
        <AuthField
          label="Email"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          error={state.fieldErrors?.email}
          required
        />
        {state.error && !state.fieldErrors && (
          <FormBanner tone="error">{state.error}</FormBanner>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 items-center justify-center rounded-[var(--radius)] bg-gradient-to-r from-accent to-accent-light font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
