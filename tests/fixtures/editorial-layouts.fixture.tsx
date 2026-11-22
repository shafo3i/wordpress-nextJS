import { createRoot } from "react-dom/client"
import { renderEditorialBlock } from "../../components/site/blocks/registry"
import { DEFAULT_THEME } from "../../components/site/utils"
import type { ContentItem } from "../../lib/site-content"
import { createDefaultBlockConfig } from "../../lib/studio/block-defaults"
import type { HomepageBlockType, BlockDisplayStyle } from "../../lib/themes/homepage-types"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
import { buildThemeCss } from "../../lib/customizer/css"
export function loadThemeCss() {
  const style = document.createElement("style")
  style.textContent = buildThemeCss({})
  document.head.append(style)
}
let root: ReturnType<typeof createRoot>
export function renderCategoryColumns(locale: "en" | "ar") {
  root ??= createRoot(document.getElementById("fixture")!)
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  const theme = { ...DEFAULT_THEME, locale, defaultLocale: "ar", direction: locale === "ar" ? "rtl" as const : "ltr" as const, dict: locale === "ar" ? ar : en }
  root.render(<div className="category-columns-fixture">
    {["world", "region", "news", "culture"].map((slug, column) => {
      const posts: ContentItem[] = Array.from({ length: 5 }, (_, index) => ({
        id: `${column}-${index}`, slug: `${slug}-${index}`, title: `${slug} story ${index}`, categories: [slug], tags: [],
        imageUrl: `https://images.test/${column}-${index}.svg`, date: new Date("2026-11-22"), excerpt: "", content: "", authorName: "",
      }))
      return <div key={slug}>{renderEditorialBlock({ block: { ...createDefaultBlockConfig("news_list"), displayStyle: "category_column", categorySlug: slug, postCount: 5 }, posts, preFiltered: true, theme, resolvedCategory: { slug, name: slug } })}</div>
    })}
  </div>)
}
export function render(
  type: HomepageBlockType | "wire",
  locale: "ar" | "en",
  count = 9,
  displayStyle?: BlockDisplayStyle,
  categoryLink?: boolean
) {
  root ??= createRoot(document.getElementById("fixture")!)
  document.documentElement.lang = locale
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  const posts: ContentItem[] = Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    slug: `post-${index + 1}`,
    title:
      locale === "ar"
        ? `عنوان الخبر رقم ${index + 1} مع تفاصيل القصة المحلية`
        : `Story ${index + 1}: the latest developments from the newsroom`,
    excerpt:
      locale === "ar"
        ? "ملخص الخبر وأبرز التفاصيل والمعلومات المرتبطة بالقصة."
        : "A concise summary of the story and the latest developments for readers.",
    content:
      index === 1
        ? '<iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe>'
        : "",
    categories:
      index === 2
        ? [locale === "ar" ? "فيديو" : "Video"]
        : [locale === "ar" ? "الأخبار" : "News"],
    tags: [],
    imageUrl: `https://images.test/${index}.svg`,
    date: new Date("2026-11-09T12:00:00Z"),
    authorName: "Editor",
    isFeatured: false,
  }))
  const block = {
    ...createDefaultBlockConfig(type === "wire" ? "news_list" : type),
    title: "",
    postCount: count,
    autoplay: false,
    ...(type === "wire" ? { displayStyle: "minimal_text" as const } : {}),
    ...(displayStyle ? { displayStyle } : {}),
    ...(categoryLink !== undefined ? { title: locale === "ar" ? "الأخبار" : "News", categorySlug: "news", showCategoryLink: categoryLink } : {}),
  }
  root.render(
    <main data-fixture-style={displayStyle || type}>
      {renderEditorialBlock({
        block,
        posts,
        theme: {
          ...DEFAULT_THEME,
          dict: locale === "ar" ? ar : en,
          locale,
          ...(categoryLink !== undefined ? { defaultLocale: "ar" } : {}),
          direction: locale === "ar" ? "rtl" : "ltr",
        },
        preFiltered: true,
      })}
    </main>
  )
}
