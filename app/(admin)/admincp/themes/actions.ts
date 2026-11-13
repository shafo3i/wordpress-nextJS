"use server";

import { revalidatePath } from "next/cache";
import { activateTheme } from "@/lib/themes/loader";
import { verifyAdmin } from "@/lib/authMIddleware";

export async function activateThemeAction(slug: string) {
  await verifyAdmin();
  try {
    await activateTheme(slug);

    revalidatePath("/admincp");
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp/customize");
    revalidatePath("/", "layout");

    return { success: true, slug };
  } catch {
    return { success: false, error: "admin.themes.activation_error" };
  }
}
