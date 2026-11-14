"use server";

import { unstable_rethrow } from "next/navigation";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { revalidatePath } from "next/cache";
import { saveCustomizerData } from "@/lib/themes/customizer";
import { ThemeMods } from "@/lib/themes/types";
import { verifyAdmin } from "@/lib/authMIddleware";

export async function saveCustomizerAction(
  stylesheet: string,
  mods: ThemeMods,
  identity: { siteTitle: string; siteTagline: string },
  activate = false
) {
  await verifyAdmin();
  try {
    await saveCustomizerData(stylesheet, mods, identity, activate);

    revalidatePath("/admincp/customize");
    revalidatePath("/admincp/themes");
    revalidatePath("/admincp/theme-settings");
    revalidatePath("/admincp");
    revalidatePath("/", "layout");
    revalidatePath("/[slug]", "page");
    revalidatePath("/posts/[slug]", "page");

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    const { dict } = await getAdminLanguageContext();
    return { success: false, error: dict["admin.customizer.notice.failed"] || "" };
  }
}
