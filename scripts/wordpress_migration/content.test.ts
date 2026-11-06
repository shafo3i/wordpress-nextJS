import { describe, expect, it } from "vitest"
import { importArticleHtml, rewriteWordPressUrl } from "./content"
const rewrite = (url: string) =>
  rewriteWordPressUrl(url, new Set(["example"]), new Map([["123", "example"]]))
describe("WordPress content conversion", () => {
  it("rewrites old media, responsive images and article links while preserving text", () => {
    const result = importArticleHtml(
      '[caption]<img src="https://jubrakanews.com/wp-content/uploads/2020/a.jpg" srcset="https://jubrakanews.com/wp-content/uploads/2020/a-300.jpg 300w">Caption[/caption]<a href="https://jubrakanews.com/?p=123">Story</a>',
      rewrite
    )
    expect(result).toContain("<figure>")
    expect(result).toContain('src="/uploads/2020/a.jpg"')
    expect(result).toContain("/uploads/2020/a-300.jpg 300w")
    expect(result).toContain('href="/ar/posts/example"')
    expect(result).toContain("Caption")
  })
  it("removes executable HTML while retaining approved video embeds", () => {
    const result = importArticleHtml(
      '<script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://evil.test/x"></iframe><iframe src="https://www.youtube.com/embed/123"></iframe>',
      rewrite
    )
    expect(result).not.toMatch(/<script|onerror|evil.test/)
    expect(result).toContain(
      'sandbox="allow-scripts allow-same-origin allow-presentation"'
    )
  })
  it("preserves external links and only rewrites known article slugs", () => {
    expect(rewrite("https://example.org/example")).toBe(
      "https://example.org/example"
    )
    expect(rewrite("https://jubrakanews.com/2020/example/")).toBe(
      "/ar/posts/example"
    )
    expect(rewrite("https://jubrakanews.com/unknown/")).toBe(
      "https://jubrakanews.com/unknown/"
    )
  })
})
