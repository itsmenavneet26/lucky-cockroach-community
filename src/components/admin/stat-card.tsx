import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  trendValue,
  trendNote,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  trendValue: string;
  trendNote: string;
}) {
  const negative = trendValue.startsWith("-");
  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-lg)] bg-accent-soft text-accent">
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-3 text-[13px] text-muted">{label}</p>
      <p className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[12px]">
        <span
          className={cn(
            "flex items-center gap-0.5 font-semibold",
            negative ? "text-danger" : "text-positive",
          )}
        >
          {negative ? (
            <ArrowDownRight size={13} />
          ) : (
            <ArrowUpRight size={13} />
          )}
          {trendValue}
        </span>
        <span className="text-muted">{trendNote}</span>
      </p>
    </div>
  );
}
