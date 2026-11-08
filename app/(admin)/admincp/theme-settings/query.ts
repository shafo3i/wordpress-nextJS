import { verifyAdminOrEditor } from "@/lib/authMIddleware"
import { getActiveThemeSlug, getAllThemes } from "@/lib/themes/loader"
import {
  getHomepageSettings,
  getThemeDefaultSettings,
} from "@/lib/themes/homepage-blocks"
import { getHomepageLayoutSettings } from "@/lib/themes/homepage-layout"
import { getOptions } from "@/services/settings.service"
import { getPostTranslations } from "@/services/language.service"

export async function getThemeSettingsQuery(targetThemeSlug?: string) {
  await verifyAdminOrEditor()
  const [activeSlug, allThemes, front] = await Promise.all([
    getActiveThemeSlug(),
    getAllThemes(),
    getOptions(["show_on_front", "page_on_front"]),
  ])
  const currentTheme =
    allThemes.find((theme) => theme.slug === (targetThemeSlug || activeSlug)) ||
    allThemes.find((theme) => theme.slug === activeSlug) ||
    allThemes[0]
  const settings = await getHomepageSettings(currentTheme.slug)
  const usesPage =
    front.show_on_front === "page" && Boolean(front.page_on_front)
  const studioPages =
    usesPage && /^\d+$/.test(front.page_on_front)
      ? await getPostTranslations(BigInt(front.page_on_front))
      : []
  return {
    allThemes,
    currentTheme,
    usesPage,
    initialLayout: getHomepageLayoutSettings(settings),
    defaultLayout: getHomepageLayoutSettings(
      getThemeDefaultSettings(currentTheme.slug)
    ),
    studioPages: studioPages.map((page) => ({
      id: String(page.postId),
      language: page.nativeName || page.languageName,
    })),
  }
}
