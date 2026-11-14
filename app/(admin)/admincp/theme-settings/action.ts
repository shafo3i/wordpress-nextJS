"use server"

import { unstable_rethrow } from "next/navigation"
import { revalidatePath } from "next/cache"
import { verifyAdmin } from "@/lib/authMIddleware"
import { getAllThemes } from "@/lib/themes/loader"
import { themeLayoutSchema } from "@/db/schema/cms-theme-layout"
import { saveThemeLayout } from "@/services/theme-layout.service"

export async function saveThemeLayoutAction(themeSlug: string, input: unknown) {
  await verifyAdmin()
  try {
    const parsed = themeLayoutSchema.safeParse(input)
    const themes = await getAllThemes()
    if (!parsed.success || !themes.some((theme) => theme.slug === themeSlug))
      return { success: false, error: "admin.theme_layout.invalid" }
    await saveThemeLayout(themeSlug, parsed.data)
    revalidatePath("/admincp/theme-settings")
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    return { success: false, error: "admin.theme_layout.save_error" }
  }
}
