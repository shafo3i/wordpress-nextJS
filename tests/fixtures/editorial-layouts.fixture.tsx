import { createRoot } from "react-dom/client"
import { renderEditorialBlock } from "../../components/site/blocks/registry"
import { DEFAULT_THEME } from "../../components/site/utils"
import type { ContentItem } from "../../lib/site-content"
import { createDefaultBlockConfig } from "../../lib/studio/block-defaults"
import type { HomepageBlockType } from "../../lib/themes/homepage-types"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
let root: ReturnType<typeof createRoot>
export function render(
  type: HomepageBlockType | "wire",
  locale: "ar" | "en",
  count = 9
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
  }
  root.render(
    <main>
      {renderEditorialBlock({
        block,
        posts,
        theme: {
          ...DEFAULT_THEME,
          dict: locale === "ar" ? ar : en,
          locale,
          direction: locale === "ar" ? "rtl" : "ltr",
        },
        preFiltered: true,
      })}
    </main>
  )
}
