import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-accent">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-soft">
        The page you&apos;re looking for may have moved, or the link might be
        broken.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to the feed</Button>
      </Link>
    </div>
  );
}
