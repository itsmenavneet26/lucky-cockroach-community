export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex items-center gap-3 text-ink-soft">
        <span
          aria-hidden
          className="h-2 w-2 animate-pulse rounded-full bg-accent"
        />
        <span className="text-[13px] uppercase tracking-[0.16em]">
          Loading admin
        </span>
      </div>
    </div>
  );
}
