import { AppearanceForm } from "@/components/admin/appearance-form";
import { getSettings } from "@/lib/queries";
import { getUser } from "@/lib/auth";

export default async function AdminAppearancePage() {
  const [settings, user] = await Promise.all([getSettings(), getUser()]);
  return (
    <AppearanceForm
      userId={user?.id ?? ""}
      announcement={settings.announcement}
      homeHero={settings.home_hero}
      volunteerHero={settings.volunteer_hero}
    />
  );
}
