import Link from "next/link";
import { redirect } from "next/navigation";
import {
  HeartHandshake,
  Clapperboard,
  Megaphone,
  Users,
  Scale,
  Code2,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getUser, getProfile } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { VolunteerForm } from "./volunteer-form";

export const metadata = {
  title: "Volunteer",
  description:
    "Join the groundwork — volunteer your time and skills with the Lucky Cockroach movement.",
  alternates: { canonical: "/volunteer" },
};

/** Six core team cards — numbered 01..06 to mirror luckycockroach.com. */
const OPEN_POSITIONS: {
  num: string;
  icon: typeof Megaphone;
  title: string;
  roles: string[];
}[] = [
  {
    num: "01",
    icon: Clapperboard,
    title: "Content & Social Media",
    roles: [
      "Video Editor (Reels / YouTube)",
      "Graphic Designer (posters, creatives)",
      "Caption & Script Writer",
      "Instagram Story Manager",
    ],
  },
  {
    num: "02",
    icon: Megaphone,
    title: "PR & Media",
    roles: [
      "Journalist / Content Researcher",
      "Media Outreach Coordinator",
      "Hindi & Regional Language Writer",
    ],
  },
  {
    num: "03",
    icon: Users,
    title: "Ground Operations",
    roles: [
      "State Coordinators (all 29 states)",
      "District Level Volunteers",
      "College Campus Ambassadors",
    ],
  },
  {
    num: "04",
    icon: Scale,
    title: "Legal & Policy",
    roles: [
      "Law Students / Lawyers (RTI, PIL)",
      "Policy Researchers",
      "Documentation Volunteers",
    ],
  },
  {
    num: "05",
    icon: Code2,
    title: "Tech",
    roles: [
      "Web Developers (frontend / backend)",
      "App Developers (Android / iOS)",
      "UI / UX Designers",
    ],
  },
  {
    num: "06",
    icon: HeartHandshake,
    title: "Community Care",
    roles: [
      "Mental Health Counsellors / Listeners",
      "Member Onboarding Volunteers",
      "Peer Support Circle Leads",
    ],
  },
];

/** "Sawaal Hain? Jawab Yahan" — bilingual FAQ. */
const FAQS: { q: string; a: string }[] = [
  {
    q: "Kya yeh paid job hai?",
    a: "Nahi. Volunteering is unpaid — yahan salary nahi milti. Yahan milta hai ek movement ka hissa banne ka mauka, real impact, aur ek community jo tumhe samajhti hai.",
  },
  {
    q: "Kitna time dena padega?",
    a: "Jitna tum de sako. Most volunteers contribute 3–6 hours a week. Some do more, some less — hum tumhari availability ke according work assign karte hain.",
  },
  {
    q: "Minimum age kya hai?",
    a: "16+ for most teams. Legal & Policy team ke liye 18+ recommended hai (RTI, PIL ke kaam mein). College students, professionals — sab welcome hain.",
  },
  {
    q: "Application bhejne ke baad kya hoga?",
    a: "Hamari team har application personally padhti hai. Tumhe 5–7 din ke andar reply milega — chahe yes ho ya no, hum reach out karenge.",
  },
  {
    q: "Mujhe specific skills nahi hain — kya phir bhi apply kar sakta hoon?",
    a: "Haan, bilkul. Most teams ke liye sirf aag chahiye — skills hum saath mein seekh lenge. Community Care, Ground Ops, aur Onboarding mein koi technical skill required nahi hai.",
  },
  {
    q: "Mera data safe hai?",
    a: "Tumhari information sirf hamari core team dekh sakti hai — kabhi share nahi hoti. We use Supabase with row-level security; aur tumhe kabhi bhi data delete karne ka right hai.",
  },
];

export default async function VolunteerPage() {
  const user = await getUser();
  const profile = user ? await getProfile() : null;
  if (user && profile && !profile.onboarded)
    redirect("/onboarding?next=/volunteer");

  const { volunteer_hero: hero } = await getSettings();

  let email = "";
  if (user) {
    const supabase = await createClient();
    email = (await supabase.auth.getUser()).data.user?.email ?? "";
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-accent/20 shadow-soft">
          {hero.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0b0a]/88 via-[#0d0b0a]/60 to-[#0d0b0a]/30" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-accent-soft via-surface to-accent-soft" />
          )}
          <div className="relative p-7 sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-danger">
              <span className="relative grid h-2 w-2 place-items-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-danger/60" />
                <span className="relative h-2 w-2 rounded-full bg-danger" />
              </span>
              Live · Volunteer applications open
            </span>
            <h1
              className={`mt-4 max-w-2xl text-[30px] font-semibold leading-tight tracking-tight sm:text-[36px] ${
                hero.image ? "text-white" : "text-ink"
              }`}
            >
              {hero.heading}
            </h1>
            <p
              className={`mt-3 max-w-2xl text-[15px] leading-relaxed ${
                hero.image ? "text-white/80" : "text-ink-soft"
              }`}
            >
              {hero.text}
            </p>
            <a
              href="#apply"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-[14px] font-semibold text-on-accent hover:bg-accent-hover"
            >
              Join the Core Team
              <ArrowRight size={15} />
            </a>
          </div>
        </section>

        {/* ── Manifesto + stats ─────────────────────────────── */}
        <section className="rounded-[var(--radius-xl)] border border-accent/30 bg-gradient-to-br from-accent-soft via-surface to-surface p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span aria-hidden>🪳</span>
            <span>The Call</span>
          </div>
          <h2 className="mt-3 max-w-3xl text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
            Lucky Cockroach ko tumhari zaroorat hai.
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
            Hum sirf ek Instagram page nahi hain. Hum ek movement hain. Aur ab
            is movement ko tumhari skills chahiye.
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-3 sm:max-w-xl">
            {[
              { value: "97,000", label: "Cockroaches" },
              { value: "6,000+", label: "Website members" },
              { value: "3,000+", label: "Active community" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-lg)] border border-border bg-surface px-3 py-3 text-center sm:px-4"
              >
                <dd className="text-[20px] font-semibold tracking-tight text-ink sm:text-[24px]">
                  {stat.value}
                </dd>
                <dt className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>

          <p className="mt-5 max-w-2xl text-[15px] font-medium leading-relaxed text-ink">
            Ab waqt hai — online se nikal ke, kuch karne ka.
          </p>
        </section>

        {/* ── Open positions — 01..06 numbered cards ───────── */}
        <section>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-danger">
            <span
              aria-hidden
              className="relative grid h-2 w-2 place-items-center"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-danger/60" />
              <span className="relative h-2 w-2 rounded-full bg-danger" />
            </span>
            <span>Open Positions — Join the Core Team</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Where the movement needs you right now
          </h2>
          <p className="mt-1 max-w-2xl text-[14px] text-ink-soft">
            Pick the team that fits your skills. You can mention the specific
            role in your application.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {OPEN_POSITIONS.map(({ num, icon: Icon, title, roles }) => (
              <article
                key={title}
                className="group relative flex flex-col rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft transition-colors hover:border-accent/40"
              >
                <span
                  aria-hidden
                  className="absolute right-5 top-5 font-mono text-[11px] font-semibold tracking-wider text-muted"
                >
                  {num}
                </span>
                <div className="flex items-center gap-3 pr-8">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] bg-accent-soft text-accent">
                    <Icon size={19} />
                  </span>
                  <h3 className="text-[15px] font-semibold text-ink">
                    {title}
                  </h3>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {roles.map((role) => (
                    <li
                      key={role}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft"
                    >
                      <span
                        aria-hidden
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent"
                      />
                      {role}
                    </li>
                  ))}
                </ul>
                <a
                  href="#apply"
                  className="mt-4 inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-accent hover:text-accent-hover"
                >
                  Apply to this team
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* ── Pitch / Yogyata block ─────────────────────────── */}
        <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-soft sm:p-7">
          <p className="text-[15px] leading-relaxed text-ink">
            Yeh job nahi hai. Yahan salary nahi milti.
            <br />
            Yahan milta hai —{" "}
            <span className="font-semibold text-accent">
              ek movement ka hissa banne ka mauka
            </span>
            . Aur woh feeling jo koi paisa nahi khareed sakta.
          </p>
          <div className="mt-4 rounded-[var(--radius)] border border-accent/20 bg-accent-soft/40 px-4 py-3 text-[13px] leading-relaxed text-ink">
            <span className="font-semibold text-ink">Yogyata?</span> Sirf ek —
            tum ek Lucky Cockroach ho. Aur tumhare andar kuch karne ki aag hai.
          </div>
          <p className="mt-4 text-[13px] font-semibold tracking-wide text-ink-soft">
            Hum girenge nahi. <span aria-hidden>🪳</span>
            <span className="ml-2 text-muted">— Lucky Cockroach India</span>
          </p>
        </section>

        {/* ── FAQ — Sawaal Hain? Jawab Yahan ───────────────── */}
        <section>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span aria-hidden>❓</span>
            <span>Sawaal Hain?</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Jawab yahan
          </h2>
          <p className="mt-1 max-w-2xl text-[14px] text-ink-soft">
            Common questions before you apply.
          </p>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
            {FAQS.map((faq, i) => (
              <details
                key={faq.q}
                className={`group ${
                  i > 0 ? "border-t border-border" : ""
                } open:bg-surface-2/40`}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-[14px] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[11px] tracking-wider text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {faq.q}
                  </span>
                  <span
                    aria-hidden
                    className="text-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 pl-[3.25rem] text-[13.5px] leading-relaxed text-ink-soft">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Form or sign-in gate ──────────────────────────── */}
        <section id="apply" className="scroll-mt-24">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span aria-hidden>🪳</span>
            <span>Apply</span>
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Join the Core Team
          </h2>
          <p className="mt-1 max-w-2xl text-[14px] text-ink-soft">
            Fill this in honestly — our team reads every application personally.
          </p>
          <div className="mt-4">
            {profile ? (
              <VolunteerForm
                defaultName={profile.display_name || profile.username}
                defaultEmail={email}
              />
            ) : (
              <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center shadow-soft">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
                  <Users size={24} />
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">
                  Sign in to apply
                </h3>
                <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-ink-soft">
                  Volunteering is open to community members. Sign in or create a
                  free account to submit your application.
                </p>
                <Link
                  href="/login?next=/volunteer"
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-[14px] font-semibold text-on-accent hover:bg-accent-hover"
                >
                  Sign in to continue
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
