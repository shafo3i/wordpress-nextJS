import { describe, expect, it } from "vitest"
import { getExcerpt } from "./utils"
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
describe("widget excerpt formatting", () => {
  it("applies the selected length to explicit excerpts", () => {
    expect(getExcerpt(article, 5)).toBe("Clean")
    expect(getExcerpt(article, 0)).toBe("")
  })
  it("does not reintroduce raw HTML entities after a deliberately empty normalized excerpt", () => {
    expect(getExcerpt({ ...article, excerpt: "" }, 100)).toBe("")
  })
})
