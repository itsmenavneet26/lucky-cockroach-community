import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface px-6 py-16 text-center shadow-soft">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
        <Icon size={22} />
      </span>
      <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-ink-soft">
        {description}
      </p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex h-10 items-center rounded-full bg-accent px-5 text-[14px] font-semibold text-on-accent hover:bg-accent-hover"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
