"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TopicError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[topic]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-ink">
        We couldn&apos;t load this topic
      </h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        Try again in a moment.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Back to feed</Button>
        </Link>
      </div>
    </div>
  );
}
