import { VolunteerAdmin } from "@/components/admin/volunteer-admin";
import { getVolunteerApplications } from "@/lib/queries";

export default async function AdminVolunteersPage() {
  const applications = await getVolunteerApplications();
  return <VolunteerAdmin applications={applications} />;
}
