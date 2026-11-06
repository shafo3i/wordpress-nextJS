import type { Metadata } from "next"
import { verifyAdminOrEditor } from "@/lib/authMIddleware"
import { getCustomizerData } from "@/lib/themes/customizer"
import { getFrontEndThemeContext } from "@/lib/site-theme"
import {
  getPublishedPosts,
  getPublishedPostsByCategory,
} from "@/lib/site-content"
import { getStudioCategories } from "@/services/studio-content.service"
import { getHomepageSettings } from "@/lib/themes/homepage-blocks"
import { getAllWidgetAreas } from "@/lib/widgets/db"
import { PreviewHost } from "./preview-host"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Rendered inside the customizer iframe; real templates with real content, styled by posted mods. */
export default async function CustomizePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; lang?: string }>
}) {
  await verifyAdminOrEditor()

  const { theme, lang } = await searchParams
  const data = await getCustomizerData(theme)
  const [base, posts, homepageSettings, widgetAreas] = await Promise.all([
    // Locale aware context: dictionary, direction, translated menus and language switcher.
    getFrontEndThemeContext({ locale: lang, currentPath: "/" }),
    getPublishedPosts(12, lang),
    getHomepageSettings(data.themeSlug),
    getAllWidgetAreas(),
  ])

  const area = (id: string) => widgetAreas.find((a) => a.id === id)?.items ?? []
  const categories = await getStudioCategories()
  const category =
    categories.find(
      (c) => c.locale === base.locale && posts[0]?.categories.includes(c.name)
    ) || categories.find((c) => c.locale === base.locale)
  const categoryArchive = category
    ? await getPublishedPostsByCategory(category.slug, 1, 36, base.locale)
    : null

  return (
    <PreviewHost
      themeSlug={data.themeSlug}
      baseTheme={base}
      initialState={{
        mods: data.mods,
        siteTitle: data.siteTitle,
        siteTagline: data.siteTagline,
        page: "home",
      }}
      posts={posts}
      categoryArchive={categoryArchive}
      categorySidebar={area("sidebar_category")}
      homepageSettings={homepageSettings}
      primarySidebar={area("sidebar_primary")}
      secondarySidebar={area("sidebar_secondary")}
      footerWidgets={{
        col1: area("footer_1"),
        col2: area("footer_2"),
        col3: area("footer_3"),
        col4: area("footer_4"),
      }}
    />
  )
}
