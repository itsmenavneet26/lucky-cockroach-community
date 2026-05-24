import { HeartPulse } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Mental Health Support", alternates: { canonical: "/mental-health" } };
export const revalidate = 3600;

export default function MentalHealthPage() {
  return (
    <AppShell>
      <ComingSoon
        icon={HeartPulse}
        title="Mental Health Support"
        description="A dedicated mental-health space — counselling sign-ups, peer support, and exam-stress resources — is on the way. In the meantime, the Get help page lists 24/7 helplines you can reach right now."
      />
    </AppShell>
  );
}
