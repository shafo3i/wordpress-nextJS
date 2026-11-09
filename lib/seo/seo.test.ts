import { afterEach, describe, expect, it, vi } from "vitest"
import {
  absoluteWebUrl,
  contentUrl,
  mediaUrl,
  publicationLanguage,
  serializeJsonLd,
  siteBaseUrl,
} from "./urls"
import { buildSiteMetadata, indexingAllowed, seoRobots } from "./metadata"
import { isOptimizableUpload, resolveAttachmentImage } from "../media-images"

afterEach(() => vi.unstubAllEnvs())
describe("SEO URLs and indexing", () => {
  it("uses News publication language codes while preserving regional URLs separately", () => {
    expect(publicationLanguage("en-GB")).toBe("en")
    expect(publicationLanguage("ar-EG")).toBe("ar")
    expect(publicationLanguage("zh-Hans")).toBe("zh-cn")
    expect(publicationLanguage("zh-Hant-TW")).toBe("zh-tw")
    expect(() => publicationLanguage("invalid!")).toThrow()
  })

  it("keeps deliberately authored external image URLs on their original host", () => {
    expect(
      mediaUrl(
        "https://external.example/wp-content/uploads/photo.jpg",
        "https://news.example"
      )
    ).toBe("https://external.example/wp-content/uploads/photo.jpg")
  })
  it("uses a single configured origin and rejects unsafe URL schemes", () => {
    const environment = {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: "https://news.example",
      NEXT_PUBLIC_APP_URL: "https://other.example",
    }
    expect(siteBaseUrl({ home: "http://localhost:3000" }, environment)).toBe(
      "https://news.example"
    )
    expect(
      contentUrl("https://news.example", "post", "خبر عربي", "ar", "ar")
    ).toBe(
      "https://news.example/posts/%D8%AE%D8%A8%D8%B1%20%D8%B9%D8%B1%D8%A8%D9%8A"
    )
    expect(
      contentUrl("https://news.example", "post", "story", "en", "ar")
    ).toBe("https://news.example/en/posts/story")
    expect(
      contentUrl("https://news.example", "page", "about", "en", "ar")
    ).toBe("https://news.example/en/about")
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,bad",
      "//evil.test",
      "https://user:pass@example.test",
    ])
      expect(absoluteWebUrl(value, "https://news.example")).toBeUndefined()
  })
  it("applies global and per-content noindex and large-image preview settings", () => {
    expect(indexingAllowed({ blog_public: "0" })).toBe(false)
    expect(indexingAllowed({ blog_public: "1" }, true)).toBe(false)
    expect(
      indexingAllowed({
        blog_public: "1",
        seo_robots_extra: "noindex, nofollow",
      })
    ).toBe(false)
    expect(
      seoRobots({
        blog_public: "1",
        seo_robots_extra: "max-image-preview:large",
      })
    ).toMatchObject({
      index: true,
      googleBot: { "max-image-preview": "large" },
    })
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://news.example")
    const metadata = buildSiteMetadata({
      blogname: "News",
      blogdescription: "Description",
      seo_meta_title_template: "%title% | %sitename%",
      blog_public: "0",
    })
    expect(metadata.metadataBase?.toString()).toBe("https://news.example/")
    expect(metadata.robots).toMatchObject({ index: false })
  })
  it("makes JSON-LD safe inside a script element", () => {
    const value = {
      headline: "</script><script>alert(1)</script>",
      name: "عربي\u2028English",
    }
    const json = serializeJsonLd(value)
    expect(json).not.toContain("<")
    expect(JSON.parse(json)).toEqual(value)
  })
})

describe("responsive media safety", () => {
  it("uses actual dimensions and uncropped derivatives from metadata", () => {
    const asset = resolveAttachmentImage(
      "https://old.example/wp-content/uploads/2026/image.png",
      "2026/image.png",
      JSON.stringify({
        width: 2000,
        height: 1000,
        sizes: {
          medium: { file: "image-800.webp", width: 800, height: 400 },
          square: { file: "square.webp", width: 400, height: 400 },
        },
      })
    )
    expect(asset.url).toBe("/uploads/2026/image.png")
    expect(asset.srcSet).toBe(
      "/uploads/2026/image-800.webp 800w, /uploads/2026/image.png 2000w"
    )
    expect(asset.width).toBe(2000)
    expect(
      resolveAttachmentImage("/uploads/image.jpg", undefined, "invalid").width
    ).toBeUndefined()
  })
  it("does not optimize arbitrary URLs, API paths, traversal or active files", () => {
    expect(isOptimizableUpload("/uploads/2026/photo.jpg")).toBe(true)
    for (const value of [
      "https://127.0.0.1/private.jpg",
      "/api/private.jpg",
      "/uploads/../api/private.jpg",
      "/uploads/%2e%2e/private.jpg",
      "/uploads/%2fprivate.jpg",
      "/uploads/a.svg",
      "/uploads/a.jpg?secret=1",
    ])
      expect(isOptimizableUpload(value)).toBe(false)
  })
})
