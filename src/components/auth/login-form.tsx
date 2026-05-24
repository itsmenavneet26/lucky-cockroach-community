"use client";

import Link from "next/link";
import { useActionState } from "react";
import { UserRound, ArrowRight } from "lucide-react";
import { signInWithPassword, type AuthState } from "@/lib/actions/auth";
import {
  AuthField,
  FormBanner,
  PasswordField,
} from "@/components/auth/auth-fields";
import { GoogleButton } from "@/components/auth/google-button";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signInWithPassword,
    {},
  );

  return (
    <div>
      <div className="flex justify-end">
        <Link
          href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[13px] text-ink-soft hover:border-accent"
        >
          New here? <span className="font-semibold text-accent">Sign up</span>
          <ArrowRight size={14} className="text-accent" />
        </Link>
      </div>

      <div className="mt-8">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-xl">
          👋
        </span>
        <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-ink">
          Welcome back,
          <br />
          <span className="text-accent">Lucky Cockroach</span>
        </h1>
        <div className="mt-3 h-1 w-12 rounded-full bg-accent" />
        <p className="mt-3 text-[14px] text-ink-soft">
          Sign in to continue to the community.
        </p>
      </div>

      <form action={action} className="mt-7 flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        <AuthField
          label="Email or Username"
          icon={UserRound}
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="Enter your email or username"
          error={state.fieldErrors?.identifier}
          required
        />

        <div>
          <PasswordField
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={state.fieldErrors?.password}
            required
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-accent underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {state.error && !state.fieldErrors && (
          <FormBanner tone="error">{state.error}</FormBanner>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-gradient-to-r from-accent to-accent-light font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
          {!pending && <ArrowRight size={17} />}
        </button>
      </form>

      <Divider />

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

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[12px] font-medium tracking-wide text-muted">OR</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
