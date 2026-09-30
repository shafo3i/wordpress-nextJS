"use server";

import { revalidatePath } from "next/cache";
import { activateTheme } from "@/lib/themes/loader";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";

export async function activateThemeAction(slug: string) {
  try {
    await verifyAdminOrEditor();
    await activateTheme(slug);

    revalidatePath("/admincp");
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp/customize");
    revalidatePath("/", "layout");

    return { success: true, slug };
  } catch (error: any) {
    console.error("Failed to activate theme:", error);
    return { success: false, error: error?.message || "Failed to activate theme." };
  }
}
