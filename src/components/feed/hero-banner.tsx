import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { HomeHero } from "@/lib/types";

export function HeroBanner({ hero }: { hero: HomeHero }) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-accent/20 shadow-soft">
      {hero.image ? (
        <>
          {/* LCP image — next/image gives WebP/AVIF + responsive sizing, and
              `priority` preloads it so it paints fast above the fold. */}
          <Image
            src={hero.image}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
          />
          {/* Overlay: in light mode the warm image tones can show through;
              in dark mode we push to near-opaque black on the text side so
              the warm bleed doesn't read as a brown wash. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0b0a]/75 via-[#0d0b0a]/35 to-transparent dark:from-black/85 dark:via-black/55 dark:to-black/5" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-accent-soft via-surface to-accent-soft dark:bg-none dark:bg-bg" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-8 text-accent/10"
          >
            <BrandMark className="h-44 w-44" />
          </div>
        </>
      )}

      <div className="relative max-w-md p-6 sm:p-8">
        <h2
          className={`text-[26px] font-semibold leading-tight tracking-tight sm:text-[28px] ${
            hero.image ? "text-white" : "text-ink"
          }`}
        >
          {hero.heading}
        </h2>
        <p
          className={`mt-2 text-[14px] ${
            hero.image ? "text-white/80" : "text-ink-soft"
          }`}
        >
          {hero.text}
        </p>
        {hero.cta_label && (
          <Link
            href={hero.cta_href || "/about"}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-5 text-[14px] font-semibold text-on-accent hover:bg-accent-hover"
          >
            {hero.cta_label}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}
