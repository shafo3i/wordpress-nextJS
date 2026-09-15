"use server";

import { revalidatePath } from "next/cache";
import { saveCustomizerData } from "@/lib/themes/customizer";
import { ThemeMods } from "@/lib/themes/types";

export async function saveCustomizerAction(
  stylesheet: string,
  mods: ThemeMods,
  identity: { siteTitle: string; siteTagline: string },
  activate = false
) {
  try {
    await saveCustomizerData(stylesheet, mods, identity, activate);
    revalidatePath("/admincp/customize");
    revalidatePath("/admincp/themes");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to save customizer data:", error);
    return { error: "Failed to publish customizer settings." };
  }
}
