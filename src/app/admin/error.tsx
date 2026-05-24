"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="px-4 py-16 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-ink">
        Admin tools are unavailable
      </h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        Something went wrong loading this page.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[11px] text-ink-soft/70">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Link href="/admin">
          <Button variant="secondary">Admin home</Button>
        </Link>
      </div>
    </div>
  );
}
