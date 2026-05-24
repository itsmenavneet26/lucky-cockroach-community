import { AppShell } from "@/components/layout/app-shell";
import { RightSidebar } from "@/components/layout/right-sidebar";

export const metadata = { title: "About", alternates: { canonical: "/about" } };
export const revalidate = 3600;

export default function AboutPage() {
  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          About the community
        </h1>
        <div className="mt-3 flex flex-col gap-3 text-[14px] leading-relaxed text-ink-soft">
          <p>
            Lucky Cockroach Community is the member space of the Lucky Cockroach
            movement — built for India&apos;s students, aspirants, and unemployed
            youth.
          </p>
          <p>
            It exists for one thing: so that nobody goes through paper leaks,
            recruitment delays, exam stress, or the job hunt feeling alone. Share
            what you&apos;re going through, ask honest questions, and stand with
            people who understand the fight.
          </p>
          <p>
            This is a support community, not a political space. Be honest, be
            kind, and look after each other.
          </p>
        </div>
      </article>
    </AppShell>
  );
}
