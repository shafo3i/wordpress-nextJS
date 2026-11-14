"use server";

import { unstable_rethrow } from "next/navigation";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { revalidatePath } from "next/cache";
import { saveWidgetArea, WidgetItem } from "@/lib/widgets/db";
import { verifyAdmin } from "@/lib/authMIddleware";

export async function saveWidgetAreaAction(areaId: string, items: WidgetItem[]) {
  await verifyAdmin();
  try {
    await saveWidgetArea(areaId, items);

    revalidatePath("/admincp");
    revalidatePath("/admincp/widgets");
    revalidatePath("/posts/[slug]", "page");
    revalidatePath("/[slug]", "page");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    const { dict } = await getAdminLanguageContext();
    return { success: false, error: dict["admin.widgets.save_failed"] || "" };
  }
}
