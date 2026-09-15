"use server";

import { revalidatePath } from "next/cache";
import {
  getActivePluginSlugs,
  setActivePluginSlugs,
  togglePlugin,
  installPlugin,
  uninstallPlugin,
} from "@/lib/plugins/loader";

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
    return { success: true };
  } catch (error) {
    console.error("Failed to uninstall plugin:", error);
    return { error: "Failed to delete plugin." };
  }
}

export async function bulkPluginsAction(slugs: string[], action: "activate" | "deactivate") {
  try {
    const currentActive = await getActivePluginSlugs();
    let updated: string[];

    if (action === "activate") {
      updated = Array.from(new Set([...currentActive, ...slugs]));
    } else {
      const toDeactivate = new Set(slugs);
      updated = currentActive.filter((s) => !toDeactivate.has(s));
    }

    await setActivePluginSlugs(updated);
    revalidatePath("/admincp/plugins");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to execute bulk action on plugins:", error);
    return { error: "Failed to process bulk action." };
  }
}
