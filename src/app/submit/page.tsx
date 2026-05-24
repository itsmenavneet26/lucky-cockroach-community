import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SubmitForm } from "./submit-form";
import { getUser, getProfile } from "@/lib/auth";
import { getTopics } from "@/lib/queries";
import type { PostType } from "@/lib/types";

export const metadata = { title: "Create a post" };

const VALID: PostType[] = ["text", "image", "link", "poll"];

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login?next=/submit");
  const profile = await getProfile();
  if (!profile?.onboarded) redirect("/onboarding?next=/submit");

  const { type } = await searchParams;
  const defaultType = (VALID.includes(type as PostType) ? type : "text") as PostType;
  const topics = await getTopics();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Create a post
          </h1>
          <p className="text-[13px] text-muted">
            Share your story, ask for help, or start a conversation.
          </p>
        </div>
        <SubmitForm topics={topics} defaultType={defaultType} userId={user.id} />
      </div>
    </AppShell>
  );
}
