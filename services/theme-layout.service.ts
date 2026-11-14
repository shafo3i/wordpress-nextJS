import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
import { hasTheme } from "@/themes/registry";
import { eq } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpOptions } from "@/db/schema"
import {
  themeLayoutSchema,
  type ThemeLayoutSettings,
} from "@/db/schema/cms-theme-layout"
import { getHomepageSettings } from "@/lib/themes/homepage-blocks"
import { mergeHomepageLayout } from "@/lib/themes/homepage-layout"

export async function saveThemeLayout(
  themeSlug: string,
  input: ThemeLayoutSettings,
  database: Pick<DB, "transaction"> = db
) {
  await verifyAdmin();
  if (!hasTheme(themeSlug)) throw new Error("Invalid theme");
  const patch = themeLayoutSchema.parse(input)
  const fallback = await getHomepageSettings(themeSlug)
  const key = `homepage_settings_${themeSlug}`
  await database.transaction(async (tx) => {
    await tx
      .insert(wpOptions)
      .values({
        optionName: key,
        optionValue: JSON.stringify(fallback),
        autoload: "yes",
      })
      .onConflictDoNothing({ target: wpOptions.optionName })
    const [current] = await tx
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, key))
      .for("update")
    const payload = mergeHomepageLayout(current.value, patch, fallback)
    await tx
      .update(wpOptions)
      .set({ optionValue: JSON.stringify(payload) })
      .where(eq(wpOptions.optionName, key))
    await tx
      .insert(wpOptions)
      .values({
        optionName: `homepage_layout_${themeSlug}`,
        optionValue: patch.layout,
        autoload: "yes",
      })
      .onConflictDoUpdate({
        target: wpOptions.optionName,
        set: { optionValue: patch.layout },
      })
  })
}
