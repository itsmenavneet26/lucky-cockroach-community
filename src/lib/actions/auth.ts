"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PUBLIC_ENV } from "@/lib/env";
import { checkRate, clientIp } from "@/lib/rate-limit";
import { fromZod, mapAuthError, type FieldErrors } from "@/lib/errors";

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("[auth] signOut:", error.message);
  redirect("/");
}

export type AuthState = {
  error?: string;
  notice?: string;
  fieldErrors?: FieldErrors;
};

const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

/** Resolve a username to its account email via the service-role client. */
async function emailForUsername(username: string): Promise<string | null> {
  const service = createServiceClient();
  const { data: profile, error } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (error) {
    console.error("[auth] emailForUsername lookup:", error.message);
    return null;
  }
  if (!profile) return null;
  const { data, error: userErr } = await service.auth.admin.getUserById(
    profile.id,
  );
  if (userErr) {
    console.error("[auth] getUserById:", userErr.message);
    return null;
  }
  return data.user?.email ?? null;
}

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    const f = fromZod(parsed.error);
    return { error: f.error, fieldErrors: f.fieldErrors };
  }

  let { identifier } = parsed.data;
  const { password, next } = parsed.data;

  // Throttle by IP (cheap defence against credential stuffing).
  const ip = await clientIp();
  if (!(await checkRate(ip, "signin", 10, 60))) {
    return {
      error: "Too many sign-in attempts. Please wait a minute and try again.",
    };
  }

  if (!identifier.includes("@")) {
    const email = await emailForUsername(identifier.toLowerCase());
    if (!email) {
      return {
        error: "No account found with that username.",
        fieldErrors: { identifier: "No account found." },
      };
    }
    identifier = email;
  }

  const supabase = await createClient();
  const { data: signIn, error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  });
  if (error || !signIn.user) {
    const mapped = mapAuthError("signIn", error ?? { message: "no user" });
    // For invalid creds, attach the error to the password field for a11y.
    const fieldErrors: FieldErrors | undefined =
      mapped.code === "validation" && error?.code === "invalid_credentials"
        ? { password: "Incorrect email or password." }
        : undefined;
    return { error: mapped.error, fieldErrors };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", signIn.user.id)
    .maybeSingle();

  if (profileErr) {
    console.error("[auth] post-signin profile lookup:", profileErr.message);
    redirect("/onboarding");
  }

  redirect(profile?.onboarded ? next || "/" : "/onboarding");
}

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(50),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  next: z.string().optional(),
});

export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    const f = fromZod(parsed.error);
    return { error: f.error, fieldErrors: f.fieldErrors };
  }

  const { name, email, password, next } = parsed.data;

  // Combined IP + email throttle. Prevents botnet signups and
  // distributed email-enumeration scans.
  const ip = await clientIp();
  if (
    !(await checkRate(ip, "signup_ip", 5, 3600)) ||
    !(await checkRate(email, "signup_email", 3, 3600))
  ) {
    return {
      error: "Too many sign-up attempts from this device. Please try again later.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${PUBLIC_ENV.SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    const mapped = mapAuthError("signUp", error);
    const fieldErrors: FieldErrors | undefined =
      mapped.code === "conflict"
        ? { email: "Already in use." }
        : mapped.code === "validation" && error.code === "weak_password"
          ? { password: mapped.error }
          : undefined;
    return { error: mapped.error, fieldErrors };
  }

  if (!data.session) {
    return {
      notice:
        "Check your email — we've sent a link to confirm your account. Once confirmed, sign in to continue.",
    };
  }

  redirect("/onboarding" + (next ? `?next=${encodeURIComponent(next)}` : ""));
}

// ── Password reset ──────────────────────────────────────────────

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    const f = fromZod(parsed.error);
    return { error: f.error, fieldErrors: f.fieldErrors };
  }

  // Throttle aggressively — password reset is the favourite vehicle for
  // email-enumeration and inbox-flooding attacks.
  const ip = await clientIp();
  if (
    !(await checkRate(ip, "pwreset_ip", 5, 3600)) ||
    !(await checkRate(parsed.data.email, "pwreset_email", 3, 3600))
  ) {
    return {
      error: "Too many reset attempts. Please wait an hour and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${PUBLIC_ENV.SITE_URL}/reset-password` },
  );
  if (error) {
    const mapped = mapAuthError("requestPasswordReset", error);
    // For rate-limit we surface the message; for everything else we
    // return a generic confirmation so we don't reveal which emails exist.
    if (mapped.code === "rate_limited") return { error: mapped.error };
  }
  return {
    notice:
      "If an account exists with that email, we've sent a reset link. Check your inbox.",
  };
}

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirm: z.string(),
});

export async function completePasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const f = fromZod(parsed.error);
    return { error: f.error, fieldErrors: f.fieldErrors };
  }
  if (parsed.data.password !== parsed.data.confirm) {
    return {
      error: "Passwords don't match.",
      fieldErrors: { confirm: "Doesn't match." },
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      error:
        "Your reset link has expired. Please request a new one from the forgot-password page.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    const mapped = mapAuthError("completePasswordReset", error);
    return {
      error: mapped.error,
      fieldErrors:
        error.code === "weak_password" || error.code === "same_password"
          ? { password: mapped.error }
          : undefined,
    };
  }
  redirect("/?reset=ok");
}
