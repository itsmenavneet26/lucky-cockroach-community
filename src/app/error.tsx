"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-accent">
        Something broke
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        We hit an unexpected error
      </h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-soft">
        Try again in a moment. If it keeps happening, head back to the feed and
        we&apos;ll keep looking into it.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-ink-soft/70">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex items-center gap-2">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Back to the feed</Button>
        </Link>
      </div>
    </div>
  );
}
