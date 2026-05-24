import { SettingsAdmin } from "@/components/admin/settings-admin";
import { getSettings } from "@/lib/queries";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return <SettingsAdmin settings={settings} />;
}
