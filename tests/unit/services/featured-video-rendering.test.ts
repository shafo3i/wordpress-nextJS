import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
vi.mock("server-only", () => ({}))
vi.mock("@/components/site/header/site-header", () => ({
  SiteHeader: () => null,
}))
vi.mock("@/components/site/footer/site-footer", () => ({
  SiteFooter: () => null,
}))
vi.mock("@/components/site/sidebar/sidebar-renderer", () => ({
  SidebarWidgetRenderer: () => null,
}))
vi.mock("@/components/site/article-share", () => ({ ArticleShare: () => null }))
vi.mock("@/components/site/post-views", () => ({ PostViews: () => null }))
vi.mock("@/components/site/content-image", () => ({
  ContentImage: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}))
vi.mock("@/components/admin/media-select-modal", () => ({
  MediaSelectModal: () => null,
}))
import { PostTemplate } from "@/components/site/templates/post-template"
import { FeaturedVideoPlayer } from "@/components/site/featured-video-player"
import { MetaBoxFeaturedVideo } from "@/components/admin/posts/editor/meta-box-featured-video"
import type { ContentItem } from "@/lib/site-content"
import { DEFAULT_THEME } from "@/components/site/utils"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"
const article: ContentItem = {
  id: "1",
  title: "Article",
  slug: "article",
  excerpt: "Summary",
  content: "<p>Article body</p><script>alert(1)</script>",
  date: new Date("2026-01-01T00:00:00Z"),
  authorName: "Author",
  categories: [],
  tags: [],
  imageUrl: "",
  isFeatured: false,
  featuredVideoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  hasFeaturedImage: false,
}
describe("Featured media output", () => {
  it("shows a safe player instead of a derived thumbnail when no featured image is assigned", () => {
    const html = renderToStaticMarkup(
      createElement(PostTemplate, {
        article: {
          ...article,
          imageUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        },
        relatedPosts: [],
        theme: { ...DEFAULT_THEME, dict: en },
        trackViews: false,
      })
    )
    expect(html).toContain('data-article-video=""')
    expect(html).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
    expect(html).not.toContain('data-article-image=""')
    expect(html).not.toContain("<script>")
  })
  it("gives an explicitly assigned featured image priority", () => {
    const html = renderToStaticMarkup(
      createElement(PostTemplate, {
        article: {
          ...article,
          hasFeaturedImage: true,
          imageUrl: "/uploads/cover.jpg",
        },
        relatedPosts: [],
        theme: { ...DEFAULT_THEME, dict: en },
        trackViews: false,
      })
    )
    expect(html).toContain('data-article-image=""')
    expect(html).toContain("/uploads/cover.jpg")
    expect(html).not.toContain('data-article-video=""')
  })
  it.each(["https://vimeo.com/1234567", "/uploads/movie.mp4"])(
    "renders supported video %s without autoplay",
    (url) => {
      const html = renderToStaticMarkup(
        createElement(FeaturedVideoPlayer, { url, title: "Video" })
      )
      expect(html).toMatch(/<iframe|<video/)
      expect(html).not.toContain("autoplay")
      if (html.includes("<iframe"))
        expect(html).toContain(
          'referrerPolicy="strict-origin-when-cross-origin"'
        )
    }
  )
  it("never turns attacker HTML or unsafe URLs into a player", () => {
    expect(
      renderToStaticMarkup(
        createElement(FeaturedVideoPlayer, {
          url: "javascript:alert(1)",
          title: "Video",
        })
      )
    ).toBe("")
  })
  it.each([en, ar])(
    "renders translated video controls and the available video choices",
    (dict) => {
      const html = renderToStaticMarkup(
        createElement(MetaBoxFeaturedVideo, {
          value: "/uploads/second.mp4",
          content:
            '<p>https://youtu.be/dQw4w9WgXcQ</p><video src="/uploads/second.mp4"></video>',
          onChange: () => {},
          dict,
        })
      )
      expect(html).toContain(dict["admin.editor.featured_video"])
      expect(html).toContain(dict["admin.editor.featured_video_help"])
      expect(html).toContain('value="/uploads/second.mp4" selected=""')
    }
  )
})
