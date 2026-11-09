import { createRoot } from "react-dom/client"
import { BreakingTickerBlock } from "../../components/site/blocks/breaking-ticker"
import { DEFAULT_THEME } from "../../components/site/utils"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"

let root: ReturnType<typeof createRoot>
export function render(rtl: boolean) {
  root ??= createRoot(document.getElementById("fixture")!)
  root.render(
    <BreakingTickerBlock
      key={String(rtl)}
      title="News"
      theme={{
        ...DEFAULT_THEME,
        direction: rtl ? "rtl" : "ltr",
        locale: rtl ? "ar" : "en",
        dict: rtl ? ar : en,
      }}
      posts={Array.from({ length: 4 }, (_, index) => ({
        id: String(index),
        slug: `story-${index}`,
        title: `Story ${index}: a headline that stays still while selecting it`,
        excerpt: "",
        content: "",
        authorName: "",
        categories: [],
        tags: [],
        imageUrl: "",
        date: new Date("2026-11-09T10:00:00Z"),
      }))}
    />
  )
}
