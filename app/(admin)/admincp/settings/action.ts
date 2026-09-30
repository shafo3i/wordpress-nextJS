"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { setOptions, type SettingsMap } from "@/services/settings.service";

export type SaveSettingsResult =
  | { success: true; message?: string }
  | { success: false; error: string };

export async function saveSettingsAction(
  entries: SettingsMap
): Promise<SaveSettingsResult> {
  try {
    await verifyAdminOrEditor();

    // Sanitize and save entries
    await setOptions(entries);

    revalidatePath("/admincp/settings");
    revalidatePath("/admincp/customize");
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp");
    revalidatePath("/", "layout");
    revalidatePath("/[slug]", "page");
    revalidatePath("/posts/[slug]", "page");

    return { success: true, message: "Settings saved successfully." };
  } catch (error: any) {
    console.error("Failed to save settings:", error);
    return {
      success: false,
      error: error?.message || "Failed to save settings.",
    };
  }
}
