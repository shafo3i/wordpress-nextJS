import { getPageById, getAllParentPageOptions } from "@/services/page.service"
import { getPublishedPosts } from "@/lib/site-content"
import { getFrontEndThemeContext } from "@/lib/site-theme"
import {
  getStudioCategories,
  getStudioDocumentContent,
} from "@/services/studio-content.service"
import {
  getActiveLanguages,
  getDefaultLanguage,
} from "@/services/language.service"
import { getAvailableWidgets, getAllWidgetAreas } from "@/lib/widgets/db"
import { verifyAdminOrEditor } from "@/lib/authMIddleware"

export async function getStudioEditorData(
  id: string,
  requestedLocale?: string
) {
  await verifyAdminOrEditor()
  const pageResult = await getPageById(id)
  if (!pageResult) return null

  const { page } = pageResult
  const [languages, defaultLanguage] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
  ])
  const locale =
    requestedLocale ||
    page.languageCode ||
    defaultLanguage?.code ||
    languages[0]?.code
  if (!locale || !languages.some((language) => language.code === locale))
    return null

  const [
    allPages,
    posts,
    theme,
    categories,
    availableWidgets,
    widgetAreas,
    widgetContent,
  ] = await Promise.all([
    getAllParentPageOptions(undefined, "all"),
    getPublishedPosts(25, locale),
    getFrontEndThemeContext({
      locale,
      currentPath: `/${page.slug}`,
    }),
    getStudioCategories(),
    getAvailableWidgets(),
    getAllWidgetAreas(),
    getStudioDocumentContent(page.studioData, locale),
  ])

  const footerWidgets = {
    col1: widgetAreas.find((a) => a.id === "footer_1")?.items || [],
    col2: widgetAreas.find((a) => a.id === "footer_2")?.items || [],
    col3: widgetAreas.find((a) => a.id === "footer_3")?.items || [],
    col4: widgetAreas.find((a) => a.id === "footer_4")?.items || [],
  }

  return {
    page,
    contentLocale: locale,
    pageLocale: page.languageCode || defaultLanguage?.code || locale,
    widgetContent,
    allPages,
    posts,
    theme,
    categories,
    availableWidgets,
    footerWidgets,
  }
}
