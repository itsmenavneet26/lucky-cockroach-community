"use client";

import Link from "next/link";
import { useActionState } from "react";
import { UserRound, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { signUpWithPassword, type AuthState } from "@/lib/actions/auth";
import {
  AuthField,
  FormBanner,
  PasswordField,
} from "@/components/auth/auth-fields";
import { GoogleButton } from "@/components/auth/google-button";

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signUpWithPassword,
    {},
  );

  if (state.notice) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-ink">
          Almost there
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          {state.notice}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--radius)] bg-gradient-to-r from-accent to-accent-light px-6 font-semibold text-white"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end">
        <Link
          href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] text-ink-soft hover:border-accent"
        >
          Have an account?{" "}
          <span className="font-semibold text-accent">Sign in</span>
          <ArrowRight size={14} className="text-accent" />
        </Link>
      </div>

      <div className="mt-8">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-xl">
          ✊
        </span>
        <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-ink">
          Join the movement,
          <br />
          <span className="text-accent">become a Lucky Cockroach</span>
        </h1>
        <div className="mt-3 h-1 w-12 rounded-full bg-accent" />
        <p className="mt-3 text-[14px] text-ink-soft">
          Create an account to share your story and stand with others.
        </p>
      </div>

      <form action={action} className="mt-7 flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <AuthField
          label="Your name"
          icon={UserRound}
          name="name"
          type="text"
          autoComplete="name"
          placeholder="What should we call you?"
          error={state.fieldErrors?.name}
          required
        />
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
        <PasswordField
          name="password"
          autoComplete="new-password"
          placeholder="Create a password (min. 8 characters)"
          minLength={8}
          error={state.fieldErrors?.password}
          hint={!state.fieldErrors?.password ? "At least 8 characters." : undefined}
          required
        />

        {state.error && !state.fieldErrors && (
          <FormBanner tone="error">{state.error}</FormBanner>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-gradient-to-r from-accent to-accent-light font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account"}
          {!pending && <ArrowRight size={17} />}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[12px] font-medium tracking-wide text-muted">OR</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton next={next} />

      <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
        🔒 By continuing, you agree to our{" "}
        <Link href="/guidelines" className="text-accent underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/guidelines" className="text-accent underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
