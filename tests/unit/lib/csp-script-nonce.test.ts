import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ site: vi.fn(), schema: vi.fn() }))
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-nonce": "server-nonce" }),
}))
vi.mock("@/lib/seo/data", () => ({ getSeoSite: mocks.site }))
vi.mock("@/lib/seo/article", () => ({ newsArticleSchema: mocks.schema }))
vi.mock("next/script", () => ({
  default: ({
    children,
    strategy: _strategy,
    ...props
  }: {
    children?: string
    strategy?: string
  }) => createElement("script", props, children),
}))
import { SiteAnalytics } from "@/components/site/site-analytics"
import { ArticleStructuredData } from "@/components/site/article-structured-data"
import type { ContentItem } from "@/lib/site-content"
describe("application script nonce wiring", () => {
  it("adds the server nonce to both analytics script tags", () => {
    const html = renderToStaticMarkup(
      createElement(SiteAnalytics, {
        measurementId: "G-TEST123",
        nonce: "server-nonce",
      })
    )
    expect(html.match(/nonce="server-nonce"/g)).toHaveLength(2)
    expect(
      renderToStaticMarkup(
        createElement(SiteAnalytics, {
          measurementId: "invalid",
          nonce: "server-nonce",
        })
      )
    ).toBe("")
  })
  it("nonces JSON-LD while preserving safe serialization", async () => {
    mocks.site.mockResolvedValue({})
    mocks.schema.mockReturnValue({
      headline: "</script><script>alert(1)</script>",
    })
    const html = renderToStaticMarkup(
      await ArticleStructuredData({ article: {} as ContentItem })
    )
    expect(html).toContain('nonce="server-nonce"')
    expect(html).toContain('type="application/ld+json"')
    expect(html).not.toContain("</script><script>")
  })
})
