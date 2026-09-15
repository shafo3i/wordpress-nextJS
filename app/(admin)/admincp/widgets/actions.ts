"use server";

import { revalidatePath } from "next/cache";
import { saveWidgetArea, WidgetItem } from "@/lib/widgets/db";

export async function saveWidgetAreaAction(areaId: string, items: WidgetItem[]) {
  try {
    await saveWidgetArea(areaId, items);
    revalidatePath("/admincp/widgets");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to save widget area:", error);
    return { error: "Failed to save widget area." };
  }
}
