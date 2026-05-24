import { GraduationCap } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Scholarship", alternates: { canonical: "/scholarship" } };
export const revalidate = 3600;

export default function ScholarshipPage() {
  return (
    <AppShell>
      <ComingSoon
        icon={GraduationCap}
        title="Scholarship"
        description="Applications for the Lucky Cockroach scholarship will open here — for students and govt-exam aspirants under financial pressure. We're putting the program together with care."
      />
    </AppShell>
  );
}
