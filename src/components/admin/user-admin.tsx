"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Ban, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { setUserRole } from "@/lib/actions/admin";
import { banUser, unbanUser } from "@/lib/actions/moderation";
import type { Profile, UserRole } from "@/lib/types";

export function UserAdmin({
  users,
  query,
  currentAdminId,
}: {
  users: Profile[];
  query: string;
  currentAdminId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeRole(userId: string, role: UserRole) {
    startTransition(async () => {
      await setUserRole(userId, role);
      router.refresh();
    });
  }

  function ban(userId: string) {
    const reason = prompt("Reason for banning this member?");
    if (reason === null) return;
    startTransition(async () => {
      await banUser(userId, reason || "Violation of community guidelines", null);
      router.refresh();
    });
  }

  function unban(userId: string) {
    startTransition(async () => {
      await unbanUser(userId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action="/admin/users" className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by username or name…"
          className="h-10 w-full rounded-[var(--radius)] border border-border bg-surface pl-9 pr-3 text-sm text-ink shadow-soft outline-none focus:border-accent"
        />
      </form>

      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-soft">
        {users.map((u) => {
          const name = u.display_name || u.username;
          const isSelf = u.id === currentAdminId;
          return (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0"
            >
              <Avatar src={u.avatar_url} name={name} size={38} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/u/${u.username}`}
                  className="text-[14px] font-semibold text-ink hover:text-accent"
                >
                  {name}
                </Link>
                <p className="text-[12px] text-muted">
                  @{u.username} · {u.karma} karma
                  {u.is_banned && (
                    <span className="ml-1 font-semibold text-danger">
                      · banned
                    </span>
                  )}
                </p>
              </div>

              <select
                value={u.role}
                disabled={isSelf || pending}
                onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                className="h-9 rounded-[var(--radius)] border border-border bg-surface-2 px-2 text-[13px] text-ink outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>

              {!isSelf &&
                (u.is_banned ? (
                  <button
                    onClick={() => unban(u.id)}
                    disabled={pending}
                    className="flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-border-strong px-3 text-[12px] font-semibold text-ink-soft hover:bg-surface-2"
                  >
                    <ShieldCheck size={14} /> Unban
                  </button>
                ) : (
                  <button
                    onClick={() => ban(u.id)}
                    disabled={pending}
                    className="flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-border-strong px-3 text-[12px] font-semibold text-danger hover:bg-accent-soft"
                  >
                    <Ban size={14} /> Ban
                  </button>
                ))}
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-muted">
            No members found.
          </p>
        )}
      </div>
    </div>
  );
}
