import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getAllSettings, type SettingsMap } from "@/services/settings.service";

export async function getSettingsQuery(): Promise<SettingsMap> {
  await verifyAdminOrEditor();
  return await getAllSettings();
}
