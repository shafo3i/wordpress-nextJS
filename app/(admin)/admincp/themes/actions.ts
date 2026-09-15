"use server";

import { revalidatePath } from "next/cache";
import { activateTheme } from "@/lib/themes/loader";

export async function activateThemeAction(slug: string) {
  try {
    await activateTheme(slug);
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp/customize");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to activate theme:", error);
    return { error: "Failed to activate theme." };
  }
}
