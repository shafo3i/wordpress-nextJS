"use server"
import { newsletterEmailSchema } from "@/db/schema/cms-newsletter"

import { revalidatePath } from "next/cache"
import { verifyPluginAdministrator } from "@/lib/plugins/authorization"
import { savePluginConfig } from "@/lib/plugins/config"
import {
  removeNewsletterSubscriber,
  clearAllNewsletterSubscribers,
} from "@/lib/newsletter/db"

export async function savePluginConfigAction(
  slug: string,
  config: Record<string, unknown>
) {
  await verifyPluginAdministrator()
  try {
    await savePluginConfig(slug, config)

    revalidatePath(`/admincp/plugins/${slug}`)
    revalidatePath("/admincp/plugins")
    revalidatePath("/", "layout")
    revalidatePath("/posts/[slug]", "page")

    return { success: true }
  } catch (err) {
    console.error("Failed to save plugin config:")
    return {
      success: false,
      error:
        err instanceof Error && err.message.startsWith("admin.plugins.")
          ? err.message
          : "admin.plugins.invalid_config",
    }
  }
}

export async function deleteSubscriberAction(email: string) {
  await verifyPluginAdministrator()
  try {
    await removeNewsletterSubscriber(newsletterEmailSchema.parse(email))
    revalidatePath("/admincp/plugins/newsletter")
    return { success: true }
  } catch {
    return { success: false, error: "admin.plugins.save_failed" }
  }
}

export async function clearSubscribersAction() {
  await verifyPluginAdministrator()
  try {
    await clearAllNewsletterSubscribers()
    revalidatePath("/admincp/plugins/newsletter")
    return { success: true }
  } catch {
    return { success: false, error: "admin.plugins.save_failed" }
  }
}
