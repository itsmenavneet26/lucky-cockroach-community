"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { setVolunteerStatus } from "@/lib/actions/admin";

export function QuickVolunteerActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  function act(status: "accepted" | "declined") {
    setDone(status);
    startTransition(async () => {
      await setVolunteerStatus(id, status);
      router.refresh();
    });
  }

  if (done) {
    return (
      <span className="text-[12px] font-semibold capitalize text-muted">
        {done}
      </span>
    );
  }

  return (
    <div className="flex gap-1.5">
      <button
        aria-label="Accept"
        disabled={pending}
        onClick={() => act("accepted")}
        className="grid h-8 w-8 place-items-center rounded-full border border-border text-positive hover:bg-surface-2 disabled:opacity-50"
      >
        <Check size={15} />
      </button>
      <button
        aria-label="Decline"
        disabled={pending}
        onClick={() => act("declined")}
        className="grid h-8 w-8 place-items-center rounded-full border border-border text-danger hover:bg-surface-2 disabled:opacity-50"
      >
        <X size={15} />
      </button>
    </div>
  );
}
