import { createRoot } from "react-dom/client"
import { PostTemplate } from "../../components/site/templates/post-template"
import { DEFAULT_THEME } from "../../components/site/utils"
import type { ThemeMods } from "../../lib/themes/types"
import { getThemeDefaultMods } from "../../lib/customizer/resolve"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
let root: ReturnType<typeof createRoot>
export function render(locale: "en" | "ar", mods: ThemeMods) {
  root ||= createRoot(document.getElementById("fixture")!)
  const theme = { ...DEFAULT_THEME, locale, direction: locale === "ar" ? "rtl" as const : "ltr" as const, dict: locale === "ar" ? ar : en, mods: { ...getThemeDefaultMods("pressforge-broadsheet"), ...mods } }
  root.render(<PostTemplate trackViews={false} theme={theme} relatedPosts={[]} sidebarWidgets={[{ id: "sidebar", type: "recent_posts", title: "" }]} newsletter={{ brandName: "Managed newsletter title", pitch: "Managed newsletter description", buttonText: "Managed subscribe button" }} article={{ id: "1", title: "Article", slug: "article", excerpt: "Summary", content: "<p>Article body</p>", date: new Date("2026-01-01T00:00:00Z"), authorName: "Writer", categories: [], tags: [], imageUrl: "/uploads/cover.jpg", hasFeaturedImage: true }} />)
}
