import { cn } from "@/lib/utils";

/** Minimal custom brand glyph — an abstract resilient-survivor mark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      <path
        d="M12 3c2.3 0 4 2 4 4.6 0 1-.3 1.9-.8 2.7 1.4.7 2.4 2.1 2.6 3.8M12 3c-2.3 0-4 2-4 4.6 0 1 .3 1.9.8 2.7-1.4.7-2.4 2.1-2.6 3.8M12 3V1.4M12 21c-3.2 0-5.6-2.6-5.6-6 0-1.3.4-2.5 1-3.4M12 21c3.2 0 5.6-2.6 5.6-6 0-1.3-.4-2.5-1-3.4M12 21v1.6M6.4 9 3.3 7.2M17.6 9l3.1-1.8M5.6 15l-3 .9M18.4 15l3 .9M12 9.5v6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
