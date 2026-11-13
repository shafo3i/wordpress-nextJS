import { verifyAdmin } from "@/lib/authMIddleware"
import { getAllSettings, type SettingsMap } from "@/services/settings.service"
import { getAllParentPageOptions } from "@/services/page.service"
import { getCustomizerData } from "@/lib/themes/customizer"

export async function getSettingsLogoQuery() {
  await verifyAdmin()
  const { mods } = await getCustomizerData()
  return { url: mods.logoUrl || "" }
}

export async function getSettingsQuery(): Promise<SettingsMap> {
  await verifyAdmin()
  const settings = await getAllSettings()
  // Secrets are never sent to the settings browser. Blank means keep the stored password.
  return { ...settings, smtp_pass: "" }
}

export async function getSettingsPagesQuery(): Promise<
  { id: string; title: string }[]
> {
  await verifyAdmin()
  return await getAllParentPageOptions(undefined, "all")
}
