"use server";

import { revalidatePath } from "next/cache";
import {
  togglePlugin,
  installPlugin,
  uninstallPlugin,
  bulkUpdatePlugins,
} from "@/services/plugin.service";

export async function togglePluginAction(slug: string, activate: boolean) {
  try {
    await togglePlugin(slug, activate);
    revalidatePath("/admincp/plugins");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle plugin:", error);
    return { error: "Failed to update plugin status." };
  }
}

export async function activatePluginAction(slug: string) {
  return togglePluginAction(slug, true);
}

export async function deactivatePluginAction(slug: string) {
  return togglePluginAction(slug, false);
}

export async function installPluginAction(slug: string) {
  try {
    await installPlugin(slug);
    revalidatePath("/admincp/plugins");
    return { success: true };
  } catch (error) {
    console.error("Failed to install plugin:", error);
    return { error: "Failed to install plugin." };
  }
}

export async function uninstallPluginAction(slug: string) {
  try {
    await uninstallPlugin(slug);
    revalidatePath("/admincp/plugins");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to uninstall plugin:", error);
    return { error: "Failed to delete plugin." };
  }
}

export async function bulkPluginsAction(
  slugs: string[],
  action: "activate" | "deactivate" | "delete"
) {
  try {
    await bulkUpdatePlugins(slugs, action);
    revalidatePath("/admincp/plugins");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to execute bulk action on plugins:", error);
    return { error: "Failed to process bulk action." };
  }
}
