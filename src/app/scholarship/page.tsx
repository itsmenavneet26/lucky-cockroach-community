import { GraduationCap } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Scholarship", alternates: { canonical: "/scholarship" } };
export const revalidate = 3600;

export default async function ScholarshipPage() {
  return (
    <PublicShell>
      <ComingSoon
        icon={GraduationCap}
        title="Scholarship"
        description="Applications for the Lucky Cockroach scholarship will open here — for students and govt-exam aspirants under financial pressure. We're putting the program together with care."
      />
    </PublicShell>
  );
}
