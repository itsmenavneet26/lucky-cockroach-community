"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PostError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[post]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-ink">
        We couldn&apos;t load this post
      </h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        It may have been removed, or our server is having a moment.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-ink-soft/70">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Back to feed</Button>
        </Link>
      </div>
    </div>
  );
}
