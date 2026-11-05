import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getAllSettings, type SettingsMap } from "@/services/settings.service";
import { getAllParentPageOptions } from "@/services/page.service";
import { getCustomizerData } from "@/lib/themes/customizer";

export async function getSettingsLogoQuery() {
  await verifyAdminOrEditor();
  const { mods } = await getCustomizerData();
  return { url: mods.logoUrl || "" };
}

export async function getSettingsQuery(): Promise<SettingsMap> {
  await verifyAdminOrEditor();
  return await getAllSettings();
}

export async function getSettingsPagesQuery(): Promise<{ id: string; title: string }[]> {
  await verifyAdminOrEditor();
  return await getAllParentPageOptions(undefined, "all");
}
