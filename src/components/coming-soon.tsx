import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-border bg-surface px-6 py-20 text-center shadow-soft">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent">
        <Icon size={26} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-soft">
        {description}
      </p>
      <span className="mt-5 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-accent">
        Coming soon
      </span>
    </div>
  );
}
