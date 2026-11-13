"use server"

import {
  settingsPatchSchema,
  testEmailSchema,
  testEmailLocaleSchema,
} from "@/db/schema/cms-settings"
import { revalidatePath } from "next/cache"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  saveAdminSettings,
  reserveSettingsTestEmail,
  type SettingsMap,
} from "@/services/settings.service"
import { removeSiteLogo, selectSiteLogo } from "@/services/site-logo.service"

export async function selectSettingsLogoAction(attachmentId: string) {
  await verifyAdmin()
  try {
    const logo = await selectSiteLogo(attachmentId)
    revalidatePath("/", "layout")
    return { success: true as const, logo }
  } catch {
    return {
      success: false as const,
      error: "admin.settings.logo.invalid_selection",
    }
  }
}

export async function removeSettingsLogoAction(): Promise<SaveSettingsResult> {
  await verifyAdmin()
  try {
    await removeSiteLogo()
    revalidatePath("/", "layout")
    return { success: true }
  } catch {
    return { success: false, error: "admin.settings.logo.remove_error" }
  }
}

export type SaveSettingsResult =
  { success: true; message?: string } | { success: false; error: string }

export async function saveSettingsAction(
  entries: SettingsMap
): Promise<SaveSettingsResult> {
  await verifyAdmin()
  try {
    // Sanitize and save entries
    const values = { ...entries }
    if (values.siteurl && values.home === undefined)
      values.home = values.siteurl
    if (!values.smtp_pass) delete values.smtp_pass
    delete values.site_logo_id // Branding has its own mutation; stale form state cannot overwrite it.
    const parsed = settingsPatchSchema.safeParse(values)
    if (!parsed.success)
      return { success: false, error: "admin.settings.invalid_values" }
    await saveAdminSettings(parsed.data)

    revalidatePath("/admincp/settings")
    revalidatePath("/admincp/customize")
    revalidatePath("/admincp/themes")
    revalidatePath("/admincp")
    revalidatePath("/", "layout")
    revalidatePath("/[slug]", "page")
    revalidatePath("/posts/[slug]", "page")

    return { success: true, message: "admin.settings.saved_notice" }
  } catch {
    console.error("Failed to save settings")
    return {
      success: false,
      error: "admin.settings.save_error",
    }
  }
}

export async function sendTestEmailAction(
  targetEmail: string,
  locale?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  await verifyAdmin()
  try {
    if (
      !testEmailSchema.safeParse(targetEmail).success ||
      !testEmailLocaleSchema.safeParse(locale).success
    ) {
      return { success: false, error: "admin.settings.test_email_error" }
    }
    await reserveSettingsTestEmail()
    const { sendTestEmail } = await import("@/lib/email")
    const res = await sendTestEmail(targetEmail, locale)
    if (!res.success) {
      return { success: false, error: "admin.settings.test_email_error" }
    }
    return { success: true, message: "admin.settings.test_email_success" }
  } catch {
    return { success: false, error: "admin.settings.test_email_error" }
  }
}
