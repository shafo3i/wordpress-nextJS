"use server";

import { revalidatePath } from "next/cache";
import {
  HomepageBlock,
  HomepageSettings,
  saveHomepageBlocks,
  saveHomepageSettings,
} from "@/lib/themes/homepage-blocks";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";

export async function saveHomepageSettingsAction(themeSlug: string, settings: HomepageSettings) {
  try {
    await verifyAdminOrEditor();
    await saveHomepageSettings(themeSlug, settings);

    revalidatePath("/admincp/theme-settings");
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp");
    revalidatePath("/", "layout");
    revalidatePath("/[slug]", "page");
    revalidatePath("/posts/[slug]", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save homepage settings:", error);
    return { success: false, error: error?.message || "Failed to save homepage layout settings." };
  }
}

// Backwards-compatible action
export async function saveHomepageBlocksAction(themeSlug: string, blocks: HomepageBlock[]) {
  try {
    await verifyAdminOrEditor();
    await saveHomepageBlocks(themeSlug, blocks);

    revalidatePath("/admincp/theme-settings");
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save homepage blocks:", error);
    return { success: false, error: error?.message || "Failed to save homepage layout blocks." };
  }
}
