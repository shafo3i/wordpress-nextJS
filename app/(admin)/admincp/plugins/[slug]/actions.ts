"use server"
import { z } from "zod"

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
  try {
    await verifyPluginAdministrator()
    await savePluginConfig(slug, config)

    revalidatePath(`/admincp/plugins/${slug}`)
    revalidatePath("/admincp/plugins")
    revalidatePath("/", "layout")
    revalidatePath("/posts/[slug]", "page")

    return { success: true }
  } catch (err) {
    console.error("Failed to save plugin config:", err)
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
  try {
    await verifyPluginAdministrator()
    await removeNewsletterSubscriber(z.string().email().max(254).parse(email))
    revalidatePath("/admincp/plugins/newsletter")
    return { success: true }
  } catch {
    return { success: false, error: "admin.plugins.save_failed" }
  }
}

export async function clearSubscribersAction() {
  try {
    await verifyPluginAdministrator()
    await clearAllNewsletterSubscribers()
    revalidatePath("/admincp/plugins/newsletter")
    return { success: true }
  } catch {
    return { success: false, error: "admin.plugins.save_failed" }
  }
}
