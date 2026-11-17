import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("a", props, children),
}))
import { getThemeModule } from "@/themes/registry"
import { getThemeDefaultSettings } from "@/lib/themes/homepage-types"
import { createDefaultBlockConfig } from "@/lib/studio/block-defaults"
import { renderEditorialBlock } from "@/components/site/blocks/registry"
import { DEFAULT_THEME } from "@/components/site/utils"
import type { ContentItem } from "@/lib/site-content"

const posts: ContentItem[] = Array.from({ length: 13 }, (_, i) => ({
  id: String(i),
  slug: `story-${i}`,
  title: `Unique story ${i}`,
  excerpt: "Summary",
  content: "",
  date: new Date("2026-11-17T12:00:00Z"),
  authorName: "Reporter",
  categories: [i % 2 ? "Sport" : "News"],
  tags: [],
  imageUrl: "",
}))
describe("Newsroom theme and editorial presentations", () => {
  it("registers an independent theme with a full-width, empty-title default", () => {
    expect(getThemeModule("pressforge-newsroom").manifest.slug).toBe(
      "pressforge-newsroom"
    )
    expect(getThemeModule("pressforge-newsroom").defaults.headerLayout).toBe(
      "inline-news"
    )
    expect(getThemeDefaultSettings("pressforge-newsroom").layout).toBe(
      "full_width"
    )
    expect(getThemeDefaultSettings("pressforge-newsroom").blocks[0].title).toBe(
      ""
    )
  })
  for (const style of [
    "newsroom_lead",
    "newsroom_category",
    "newsroom_strip",
  ] as const) {
    it(`renders every selected article once in ${style}, without ad placeholders`, () => {
      const block = {
        ...createDefaultBlockConfig("newsroom"),
        displayStyle: style,
        postCount: 13,
      }
      const html = renderToStaticMarkup(
        renderEditorialBlock({ block, posts, theme: DEFAULT_THEME })
      )
      expect(html.match(/<article/g)).toHaveLength(13)
      for (const post of posts)
        expect(html.split(`>${post.title}</a>`).length - 1).toBe(1)
      expect(html).not.toMatch(/advertisement|iframe|<script/i)
    })
    it(`respects category filtering and hidden metadata in ${style}`, () => {
      const block = {
        ...createDefaultBlockConfig("newsroom"),
        displayStyle: style,
        postCount: 13,
        categorySlug: "Sport",
        showAuthor: false,
        showDate: false,
        showCategory: false,
      }
      const html = renderToStaticMarkup(
        renderEditorialBlock({
          block,
          posts,
          theme: { ...DEFAULT_THEME, direction: "rtl" },
        })
      )
      expect(html.match(/<article/g)).toHaveLength(6)
      expect(html).not.toContain("Unique story 0")
      expect(html).not.toContain("Reporter")
      expect(html).not.toContain("<time")
      expect(html).toContain('dir="rtl"')
    })
  }
})
