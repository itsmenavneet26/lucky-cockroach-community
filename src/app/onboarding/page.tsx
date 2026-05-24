import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Users, Target, ArrowRight, LogOut } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getProfile, getUser } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Set up your profile" };

const benefits = [
  {
    icon: Sparkles,
    title: "Personalised opportunities",
    body: "Get roles that match your skills, interests and availability.",
  },
  {
    icon: Users,
    title: "Stronger community",
    body: "Connect with like-minded changemakers across India.",
  },
  {
    icon: Target,
    title: "Real impact",
    body: "Every action you take brings us closer to a just society.",
  },
];

function StepIndicator() {
  const steps = [
    { n: 1, label: "Sign in", state: "done" as const },
    { n: 2, label: "Set up profile", state: "active" as const },
    { n: 3, label: "Join the community", state: "upcoming" as const },
  ];
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <span
            className={
              s.state === "active"
                ? "flex h-9 items-center gap-2 rounded-full bg-accent px-3 text-[12px] font-semibold text-on-accent"
                : s.state === "done"
                  ? "flex h-9 items-center gap-2 rounded-full bg-accent/15 px-3 text-[12px] font-semibold text-accent"
                  : "flex h-9 items-center gap-2 rounded-full border border-border px-3 text-[12px] font-semibold text-muted"
            }
          >
            <span
              className={
                s.state === "upcoming"
                  ? "grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-[11px] text-ink-soft"
                  : "text-[12px]"
              }
            >
              {s.n}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </span>
          {i < steps.length - 1 && (
            <span className="h-px w-6 bg-border sm:w-10" />
          )}
        </div>
      ))}
    </div>
  );
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getUser();
  if (!user) redirect("/login?next=/onboarding");

  const profile = await getProfile();
  if (profile?.onboarded) redirect(next || "/");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Left panel — sticky, doesn't scroll with the form */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#f8efe0] via-[#f6e6d2] to-[#f8efe0] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        {/* Image at lower portion only */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-cover bg-bottom opacity-90"
          style={{ backgroundImage: "url(/onboarding.png)" }}
        />
        {/* Soft fade from cream (top) to clear (middle) — keeps text readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f8efe0] via-[#f8efe0]/85 to-transparent" />

        <div className="relative flex h-full flex-col px-10 py-8 xl:px-14 xl:py-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-lg)] bg-accent text-on-accent">
              <BrandMark className="h-6 w-6" />
            </span>
            <span className="text-[18px] font-semibold tracking-tight text-ink">
              Lucky <span className="text-accent">Cockroach</span>
            </span>
          </Link>

          <div className="mt-8 flex-1">
            <h2 className="text-[40px] font-bold uppercase leading-[1.0] tracking-tight text-ink xl:text-[48px]">
              One profile.
              <br />
              <span className="text-accent">Many impacts.</span>
              <br />
              Endless change.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Tell us about yourself so we can match you with opportunities that
              make the most impact.
            </p>

            <ul className="mt-7 flex flex-col gap-3">
              {benefits.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex gap-3 rounded-[var(--radius-lg)] bg-surface/85 p-3 backdrop-blur-sm"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">
                      {title}
                    </p>
                    <p className="text-[13px] leading-snug text-ink-soft">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Right panel — scrolls */}
      <div className="flex flex-col bg-bg">
        <div className="flex items-center justify-between gap-3 px-6 pt-6 sm:px-10">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:border-danger hover:text-danger"
            >
              <LogOut size={13} /> Sign out
            </button>
          </form>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
          >
            Skip for now <ArrowRight size={13} />
          </Link>
        </div>

        <div className="px-6 pt-4 sm:px-10">
          <StepIndicator />
        </div>

        <div className="mx-auto w-full max-w-xl flex-1 px-6 py-6 sm:px-10">
          <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-soft sm:p-8">
            <OnboardingForm
              userId={user.id}
              defaultUsername={profile?.username ?? ""}
              defaultName={profile?.display_name ?? ""}
              defaultAvatar={profile?.avatar_url ?? ""}
              next={next || "/"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
