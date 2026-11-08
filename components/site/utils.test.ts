import { describe, expect, it } from "vitest"
import { getExcerpt, localizePath } from "./utils"
import type { ContentItem } from "@/lib/site-content"

const article: ContentItem = {
  id: "1",
  title: "",
  slug: "",
  excerpt: "Clean text",
  content: "<p>&nbsp;&nbsp;</p>",
  date: new Date(0),
  authorName: "",
  categories: [],
  tags: [],
  imageUrl: "",
}
describe("navigation language prefixes", () => {
  it.each([
    ["/ar", "ar", "ar", "/"],
    ["/ar/", "ar", "ar", "/"],
    ["/", "en", "ar", "/en"],
    ["/en", "en", "ar", "/en"],
    ["/ar", "ar", "en", "/ar"],
    ["/en", "en", "en", "/"],
    ["/ar/category/news?sort=date#top", "ar", "ar", "/category/news?sort=date#top"],
    ["/ar?source=menu", "en", "ar", "/en?source=menu"],
    ["/category/news", "en", "ar", "/en/category/news"],
    ["/fr/category/news", "en", "ar", "/en/category/news"],
    ["/archive", "en", "ar", "/en/archive"],
    ["https://example.com/ar", "ar", "ar", "https://example.com/ar"],
    ["//example.com/ar", "ar", "ar", "//example.com/ar"],
    ["#news", "en", "ar", "#news"],
  ])("localizes %s for %s with %s default", (path, locale, defaultLocale, expected) => {
    expect(localizePath(path, locale, defaultLocale, ["ar", "en", "fr"])).toBe(expected)
  })
})
describe("widget excerpt formatting", () => {
  it("applies the selected length to explicit excerpts", () => {
    expect(getExcerpt(article, 5)).toBe("Clean")
    expect(getExcerpt(article, 0)).toBe("")
  })
  it("does not reintroduce raw HTML entities after a deliberately empty normalized excerpt", () => {
    expect(getExcerpt({ ...article, excerpt: "" }, 100)).toBe("")
  })
})
