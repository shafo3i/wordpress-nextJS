"use server";

import { revalidatePath } from "next/cache";
import {
  HomepageBlock,
  HomepageSettings,
  saveHomepageBlocks,
  saveHomepageSettings,
} from "@/lib/themes/homepage-blocks";

export async function saveHomepageSettingsAction(themeSlug: string, settings: HomepageSettings) {
  try {
    await saveHomepageSettings(themeSlug, settings);
    revalidatePath("/admincp/theme-settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to save homepage settings:", error);
    return { error: "Failed to save homepage layout settings." };
  }
}

// Backwards-compatible action
export async function saveHomepageBlocksAction(themeSlug: string, blocks: HomepageBlock[]) {
  try {
    await saveHomepageBlocks(themeSlug, blocks);
    revalidatePath("/admincp/theme-settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to save homepage blocks:", error);
    return { error: "Failed to save homepage layout blocks." };
  }
}
