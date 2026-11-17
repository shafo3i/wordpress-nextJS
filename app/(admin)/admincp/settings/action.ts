"use server"

export async function saveMediaStorageAction(input: unknown) {
  await verifyAdmin()
  try {
    const { saveMediaStorage } = await import("@/services/media-storage.service")
    const settings = await saveMediaStorage(input)
    revalidatePath("/admincp/settings")
    return { success: true as const, settings }
  } catch { return { success: false as const } }
}
export async function testMediaStorageAction() {
  await verifyAdmin()
  try { await (await import("@/services/media-storage.service")).testMediaStorageConnection(); return { success: true as const } }
  catch { return { success: false as const } }
}
export async function retryMediaStorageCleanupAction() {
  await verifyAdmin()
  try { const result = await (await import("@/services/media-storage.service")).retryMediaStorageCleanup(); return { success: true as const, ...result } }
  catch { return { success: false as const } }
}

import {
  settingsPatchSchema,
  testEmailSchema,
  testEmailLocaleSchema,
} from "@/db/schema/cms-settings"
import { checkCmsRateLimit, RateLimitError } from "@/lib/rate-limit"
import { revalidatePath } from "next/cache"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  saveAdminSettings,
  reserveSettingsTestEmail,
  type SettingsMap,
} from "@/services/settings.service"
import { removeSiteLogo, selectSiteLogo } from "@/services/site-logo.service"
import { siteLogoTargetSchema } from "@/db/schema/cms-site-logo"

export async function selectSettingsLogoAction(attachmentId: string, target: "header" | "footer" = "header") {
  const session = await verifyAdmin()
  try {
    await checkCmsRateLimit(session.user.id, "write")
    const location = siteLogoTargetSchema.parse(target)
    const logo = location === "header" ? await selectSiteLogo(attachmentId) : await selectSiteLogo(attachmentId, location)
    revalidatePath("/", "layout")
    return { success: true as const, logo }
  } catch (error) {
    if (error instanceof RateLimitError) return { success: false as const, error: error.message }
    return {
      success: false as const,
      error: "admin.settings.logo.invalid_selection",
    }
  }
}

export async function removeSettingsLogoAction(target: "header" | "footer" = "header"): Promise<SaveSettingsResult> {
  const session = await verifyAdmin()
  try {
    await checkCmsRateLimit(session.user.id, "write")
    const location = siteLogoTargetSchema.parse(target)
    if (location === "header") await removeSiteLogo()
    else await removeSiteLogo(location)
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    if (error instanceof RateLimitError) return { success: false as const, error: error.message }
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
    delete values.footer_logo_id
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
  } catch (error) {
    if (error instanceof RateLimitError) return { success: false as const, error: error.message }
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
  } catch (error) {
    if (error instanceof RateLimitError) return { success: false as const, error: error.message }
    return { success: false, error: "admin.settings.test_email_error" }
  }
}
