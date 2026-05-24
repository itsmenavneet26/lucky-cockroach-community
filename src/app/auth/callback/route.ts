import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** OAuth + email-link return point — exchanges the code for a session,
 *  then routes the user to onboarding (first time) or their destination. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";

  // Only allow same-origin redirects.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(
    code,
  );
  if (exchangeErr) {
    console.error("[auth/callback] exchangeCodeForSession:", exchangeErr.message);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    console.error(
      "[auth/callback] getUser after exchange:",
      userErr?.message ?? "no user",
    );
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileErr) {
    console.error("[auth/callback] profile lookup:", profileErr.message);
    // Send through onboarding — the profile row may still be initialising.
    return NextResponse.redirect(
      `${origin}/onboarding?next=${encodeURIComponent(next)}`,
    );
  }

  if (!profile?.onboarded) {
    return NextResponse.redirect(
      `${origin}/onboarding?next=${encodeURIComponent(next)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
