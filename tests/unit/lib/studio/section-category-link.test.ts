import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: React.ReactNode }) => createElement("a", props, children) }))
import { renderEditorialBlock } from "@/components/site/blocks/registry"
import { DEFAULT_THEME } from "@/components/site/utils"
import { createDefaultBlockConfig } from "@/lib/studio/block-defaults"
import type { HomepageBlock } from "@/lib/themes/homepage-types"
import type { ContentItem } from "@/lib/site-content"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"
const post: ContentItem = { id: "1", title: "Story", slug: "story", imageUrl: "", categories: [], tags: [], date: new Date("2026-11-19"), excerpt: "", content: "", authorName: "" }
const render = (patch: Partial<HomepageBlock> = {}, locale = "en", category: { slug: string } | null = { slug: "sudan-news" }) => renderToStaticMarkup(renderEditorialBlock({
  block: { ...createDefaultBlockConfig("category_grid"), title: "Section", categoryId: "42", ...patch },
  posts: [post], preFiltered: true, resolvedCategory: category,
  theme: { ...DEFAULT_THEME, locale, defaultLocale: "ar", direction: locale === "ar" ? "rtl" : "ltr", dict: locale === "ar" ? ar : en },
}))
describe("section category links", () => {
  it("links to the resolved translated category instead of a stale saved slug", () => {
    expect(render({ categorySlug: "old-slug" })).toContain('href="/en/category/sudan-news"')
    expect(render()).toContain(en["site.read_more"])
    expect(render({}, "ar")).toContain('href="/category/sudan-news"')
    expect(render({}, "ar")).toContain(ar["site.read_more"])
  })
  it("hides automatic links when disabled, title is hidden or category is unresolved", () => {
    expect(render({ showCategoryLink: false })).not.toContain("/category/")
    expect(render({ showTitle: false })).not.toContain("/category/")
    expect(render({}, "en", null)).not.toContain("/category/")
  })
  it("keeps custom labels and legacy explicit links", () => {
    expect(render({ linkText: "More reports" })).toContain("More reports")
    expect(render({ linkText: "Custom", linkHref: "/archive" })).toContain('href="/en/archive"')
  })
  it("forwards the section link in compact post widgets too", () => {
    expect(render({ type: "recent_posts", displayStyle: "compact_posts" })).toContain('href="/en/category/sudan-news"')
  })
})
