"use server";

import { revalidatePath } from "next/cache";
import { saveWidgetArea, WidgetItem } from "@/lib/widgets/db";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";

export async function saveWidgetAreaAction(areaId: string, items: WidgetItem[]) {
  try {
    await verifyAdminOrEditor();
    await saveWidgetArea(areaId, items);

    revalidatePath("/admincp");
    revalidatePath("/admincp/widgets");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/[slug]", "page");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save widget area:", error);
    return { success: false, error: error?.message || "Failed to save widget area." };
  }
}
