import { AppShell } from "@/components/layout/app-shell";
import { RightSidebar } from "@/components/layout/right-sidebar";

export const metadata = { title: "Community guidelines" };
export const revalidate = 3600;

const rules = [
  ["Be kind", "People here are going through hard things. Respond the way you'd want someone to respond to you."],
  ["Keep it honest", "Share real experiences. Don't spread unverified claims, especially about exams and recruitment."],
  ["No harassment", "No personal attacks, bullying, hate speech, or targeting based on caste, religion, gender, or region."],
  ["Protect privacy", "Don't share anyone's personal details — including your own contact info in public posts."],
  ["Stay on purpose", "This is a support community. No spam, no selling, no political campaigning."],
  ["Take care with crisis", "If someone is in danger, point them to the Get help page. Don't dismiss anyone reaching out."],
];

export default function GuidelinesPage() {
  return (
    <AppShell rightSidebar={<RightSidebar />}>
      <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Community guidelines
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          A few simple rules keep this a place worth coming back to.
        </p>
        <ol className="mt-4 flex flex-col gap-3">
          {rules.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-ink">{title}</p>
                <p className="text-[13px] leading-relaxed text-ink-soft">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </article>
    </AppShell>
  );
}
