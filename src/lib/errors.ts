/**
 * Centralised error handling for server actions and queries.
 *
 * Goals:
 *  - Every action returns a discriminated `ActionResult<T>` so the UI
 *    can switch on `code` / `fieldErrors` instead of string-matching.
 *  - Database and auth errors are mapped to user-readable messages
 *    in ONE place (no more "Something went wrong" sprinkled around).
 *  - Server logs always include the raw error with a scope tag.
 */

import { ZodError, type ZodIssue } from "zod";

// ── Result types ────────────────────────────────────────────────

export type ErrorCode =
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unavailable"
  | "server";

export type FieldErrors = Record<string, string>;

export type ActionFailure = {
  ok: false;
  code: ErrorCode;
  error: string;
  fieldErrors?: FieldErrors;
};

export type ActionSuccess<T> = { ok: true; data?: T };

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

// ── Builders ────────────────────────────────────────────────────

export const ok = <T>(data?: T): ActionSuccess<T> => ({ ok: true, data });

export const fail = (
  code: ErrorCode,
  error: string,
  fieldErrors?: FieldErrors,
): ActionFailure => ({ ok: false, code, error, fieldErrors });

export const validationFail = (issues: ZodIssue[]): ActionFailure => {
  const fieldErrors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  const first = issues[0]?.message ?? "Please check the highlighted fields.";
  return { ok: false, code: "validation", error: first, fieldErrors };
};

// ── Zod helper ──────────────────────────────────────────────────

export function fromZod(err: ZodError): ActionFailure {
  return validationFail(err.issues);
}

// ── Supabase Postgres error mapping ─────────────────────────────

type DbErrorLike = {
  code?: string | null;
  message: string;
  details?: string | null;
  hint?: string | null;
};

/** Postgres SQLSTATE + PostgREST codes we recognise. */
const PG = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
  STRING_RIGHT_TRUNCATION: "22001",
  INSUFFICIENT_PRIVILEGE: "42501",
  UNDEFINED_FUNCTION: "42883",
  UNDEFINED_TABLE: "42P01",
  RAISE_EXCEPTION: "P0001",
  NOT_FOUND: "PGRST116",
  // PostgREST: function not in schema cache (a migration hasn't been run).
  POSTGREST_FN_NOT_FOUND: "PGRST202",
  // PostgREST: relation not in schema cache.
  POSTGREST_REL_NOT_FOUND: "PGRST205",
  // PostgREST: JWT expired or invalid.
  POSTGREST_JWT_EXPIRED: "PGRST301",
} as const;

/**
 * Map a Supabase DB error to a user-facing message + ErrorCode.
 * `scope` is included only in the server log, never in the user message.
 */
export function mapDbError(
  scope: string,
  err: DbErrorLike,
  overrides?: Partial<Record<string, { code: ErrorCode; message: string }>>,
): ActionFailure {
  // Single structured line per failure so logs are greppable in prod.
  console.error(
    `[db-error] scope=${scope} code=${err.code ?? "none"} msg=${JSON.stringify(err.message ?? "")} details=${JSON.stringify(err.details ?? "")} hint=${JSON.stringify(err.hint ?? "")}`,
  );

  const code = err.code ?? "";
  const ov = overrides?.[code];
  if (ov) return fail(ov.code, ov.message);

  // Rate-limit raised from our SQL function: P0001 + message includes
  // "rate_limit" or "check_rate_limit".
  if (
    code === PG.RAISE_EXCEPTION &&
    /rate_limit|too many|slow down/i.test(err.message)
  ) {
    return fail(
      "rate_limited",
      "You're doing that a little too often. Please wait a minute and try again.",
    );
  }

  switch (code) {
    case PG.UNIQUE_VIOLATION:
      return fail("conflict", "That already exists.");
    case PG.FOREIGN_KEY_VIOLATION:
      return fail("not_found", "That item is no longer available.");
    case PG.NOT_NULL_VIOLATION:
    case PG.CHECK_VIOLATION:
      return fail("validation", "Some required information is missing or invalid.");
    case PG.STRING_RIGHT_TRUNCATION:
      return fail("validation", "One of the fields is too long.");
    case PG.INSUFFICIENT_PRIVILEGE:
      return fail("forbidden", "You don't have permission to do that.");
    case PG.NOT_FOUND:
      return fail("not_found", "We couldn't find what you were looking for.");
    case PG.POSTGREST_JWT_EXPIRED:
      return fail("unauthenticated", "Your session expired. Please sign in again.");
    case PG.POSTGREST_FN_NOT_FOUND:
    case PG.POSTGREST_REL_NOT_FOUND:
    case PG.UNDEFINED_FUNCTION:
    case PG.UNDEFINED_TABLE:
      // A required DB object isn't present — usually a pending migration on
      // the live database. Log loudly so admins can see; tell users it's an
      // outage they can't fix themselves.
      console.error(
        `[db-error] MIGRATION MISSING in scope=${scope} — apply pending Supabase migrations: ${err.message}`,
      );
      return fail(
        "unavailable",
        "This feature is temporarily unavailable. The team has been notified.",
      );
    case PG.RAISE_EXCEPTION:
      // Fall through — surface the DB-provided message if it's safe-looking.
      return fail("server", humanizeDbMessage(err.message));
    default:
      // Surface a tiny ref tag so users + support can find the log line by scope.
      return fail(
        "server",
        `Something on our end didn't work. Please try again in a moment. (ref: ${scope})`,
      );
  }
}

function humanizeDbMessage(raw: string): string {
  // Strip "ERROR:  " and trailing context lines.
  const first = raw.split("\n")[0]?.replace(/^ERROR:\s*/i, "").trim();
  if (!first) return "Something on our end didn't work.";
  // Cap length so a noisy DB message can't dominate the UI.
  return first.length > 160 ? first.slice(0, 157) + "…" : first;
}

// ── Supabase Auth error mapping ─────────────────────────────────

type AuthErrorLike = { code?: string | null; message: string; status?: number };

export function mapAuthError(scope: string, err: AuthErrorLike): ActionFailure {
  console.warn(`[${scope}] auth:`, err.code ?? "", err.message);

  const code = err.code ?? "";
  switch (code) {
    case "invalid_credentials":
      return fail("validation", "Incorrect email or password.");
    case "email_not_confirmed":
      return fail(
        "forbidden",
        "Please confirm your email address. Check your inbox for the link we sent you.",
      );
    case "user_already_exists":
    case "email_exists":
      return fail("conflict", "An account with that email already exists.");
    case "weak_password":
      return fail(
        "validation",
        err.message || "Please choose a stronger password.",
      );
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return fail(
        "rate_limited",
        "Too many attempts. Please wait a few minutes before trying again.",
      );
    case "signup_disabled":
      return fail("forbidden", "New signups are temporarily disabled.");
    case "user_not_found":
      return fail("not_found", "We couldn't find that account.");
    case "same_password":
      return fail(
        "validation",
        "Your new password must be different from your current one.",
      );
    default:
      // Fall back to message — most Supabase auth messages are user-safe.
      return fail(
        "validation",
        err.message || "We couldn't complete that. Please try again.",
      );
  }
}

// ── Convenience guards ──────────────────────────────────────────

export const unauthenticated = (): ActionFailure =>
  fail("unauthenticated", "Please sign in to continue.");

export const forbidden = (msg = "You don't have permission to do that."): ActionFailure =>
  fail("forbidden", msg);

export const notFound = (msg = "We couldn't find that."): ActionFailure =>
  fail("not_found", msg);
