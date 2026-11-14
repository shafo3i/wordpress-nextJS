"use server"

import { verifyPluginAdministrator } from "@/lib/plugins/authorization"
import {
  pluginSlugSchema,
  pluginBulkSchema,
  retiredPlugins,
} from "@/db/schema/cms-plugins"
import { revalidatePath } from "next/cache"
import {
  togglePlugin,
  installPlugin,
  uninstallPlugin,
  bulkUpdatePlugins,
} from "@/services/plugin.service"

export async function togglePluginAction(slug: string, activate: boolean) {
  await verifyPluginAdministrator()
  try {
    slug = pluginSlugSchema.parse(slug)
    if (typeof activate !== "boolean" || (activate && retiredPlugins.has(slug)))
      throw new Error("admin.plugins.invalid_config")
    await togglePlugin(slug, activate)
    revalidatePath("/admincp/plugins")
    revalidatePath("/posts/[slug]", "page")
    revalidatePath("/", "layout")
    return { success: true }
  } catch {
    console.error("Failed to toggle plugin:")
    return { error: "admin.plugins.save_failed" }
  }
}

export async function activatePluginAction(slug: string) {
  return togglePluginAction(slug, true)
}

export async function deactivatePluginAction(slug: string) {
  return togglePluginAction(slug, false)
}

export async function installPluginAction(slug: string) {
  await verifyPluginAdministrator()
  try {
    slug = pluginSlugSchema.parse(slug)
    if (retiredPlugins.has(slug)) throw new Error("admin.plugins.retired")
    await installPlugin(slug)
    revalidatePath("/admincp/plugins")
    return { success: true }
  } catch {
    console.error("Failed to install plugin:")
    return { error: "admin.plugins.save_failed" }
  }
}

export async function uninstallPluginAction(slug: string) {
  await verifyPluginAdministrator()
  try {
    slug = pluginSlugSchema.parse(slug)
    await uninstallPlugin(slug)
    revalidatePath("/admincp/plugins")
    revalidatePath("/posts/[slug]", "page")
    revalidatePath("/", "layout")
    return { success: true }
  } catch {
    console.error("Failed to uninstall plugin:")
    return { error: "admin.plugins.save_failed" }
  }
}

export async function bulkPluginsAction(
  slugs: string[],
  action: "activate" | "deactivate" | "delete"
) {
  await verifyPluginAdministrator()
  try {
    const parsed = pluginBulkSchema.parse({ slugs, action })
    if (action === "activate" && slugs.some((slug) => retiredPlugins.has(slug)))
      throw new Error("admin.plugins.retired")
    await bulkUpdatePlugins(parsed.slugs, parsed.action)
    revalidatePath("/admincp/plugins")
    revalidatePath("/posts/[slug]", "page")
    revalidatePath("/", "layout")
    return { success: true }
  } catch {
    console.error("Failed to execute bulk action on plugins:")
    return { error: "admin.plugins.save_failed" }
  }
}
