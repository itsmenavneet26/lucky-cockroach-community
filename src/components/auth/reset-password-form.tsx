"use client";

import { useActionState } from "react";
import {
  completePasswordReset,
  type AuthState,
} from "@/lib/actions/auth";
import {
  FormBanner,
  PasswordField,
} from "@/components/auth/auth-fields";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    completePasswordReset,
    {},
  );

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">
        Set a new password
      </h1>
      <div className="mt-3 h-1 w-12 rounded-full bg-accent" />
      <p className="mt-3 text-[14px] text-ink-soft">
        Choose a new password for your account.
      </p>

      <form action={action} className="mt-7 flex flex-col gap-4">
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          error={state.fieldErrors?.password}
          hint={!state.fieldErrors?.password ? "At least 8 characters." : undefined}
          required
        />
        <PasswordField
          label="Confirm new password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Type it again"
          minLength={8}
          error={state.fieldErrors?.confirm}
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
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
