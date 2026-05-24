import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsForm } from "./settings-form";
import { getProfile } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/settings");

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Settings
          </h1>
          <p className="text-[13px] text-muted">
            Manage your profile and account.
          </p>
        </div>

        <SettingsForm
          userId={profile.id}
          username={profile.username}
          displayName={profile.display_name ?? ""}
          bio={profile.bio ?? ""}
          avatarUrl={profile.avatar_url ?? ""}
          pronouns={profile.pronouns ?? ""}
          location={profile.location ?? ""}
          status={profile.status ?? ""}
          interests={profile.interests ?? []}
        />

        <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-soft">
          <h2 className="text-[15px] font-semibold text-ink">Account</h2>
          <p className="mt-1 text-[13px] text-ink-soft">
            Signed in. Sign out of this device below.
          </p>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-4 text-[13px] font-medium text-ink-soft hover:bg-surface-2"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
