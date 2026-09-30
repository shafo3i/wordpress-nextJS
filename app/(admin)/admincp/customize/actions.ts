"use server";

import { revalidatePath } from "next/cache";
import { saveCustomizerData } from "@/lib/themes/customizer";
import { ThemeMods } from "@/lib/themes/types";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";

export async function saveCustomizerAction(
  stylesheet: string,
  mods: ThemeMods,
  identity: { siteTitle: string; siteTagline: string },
  activate = false
) {
  try {
    await verifyAdminOrEditor();
    await saveCustomizerData(stylesheet, mods, identity, activate);

    revalidatePath("/admincp/customize");
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp/theme-settings");
    revalidatePath("/admincp");
    revalidatePath("/", "layout");
    revalidatePath("/[slug]", "page");
    revalidatePath("/posts/[slug]", "page");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save customizer data:", error);
    return { success: false, error: error?.message || "Failed to publish customizer settings." };
  }
}
