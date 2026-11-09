import { describe, expect, it, vi } from "vitest"
import { XMLParser, XMLValidator } from "fast-xml-parser"
const { select, getSite, getSeo } = vi.hoisted(() => ({
  select: vi.fn(),
  getSite: vi.fn(),
  getSeo: vi.fn(),
}))
vi.mock("@/db", () => ({ db: { select } }))
vi.mock("@/lib/seo/data", () => ({
  getSeoSite: getSite,
  getPostSeoMap: getSeo,
  indexablePostWhere: vi.fn(),
}))
import {
  newsSitemapXml,
  standardSitemapXml,
  splitSitemap,
  sitemapIndex,
  generateNewsSitemapXml,
} from "@/services/sitemap.service"

describe("sitemap serialization", () => {
  it("returns an empty news feed rather than querying old posts as a fallback", async () => {
    select.mockReturnValue({
      from: () => ({
        innerJoin: () => ({
          innerJoin: () => ({ where: () => ({ orderBy: async () => [] }) }),
        }),
      }),
    })
    getSite.mockResolvedValue({
      base: "https://news.example",
      defaultLocale: "ar",
      options: { blog_public: "1", blogname: "Publisher" },
    })
    getSeo.mockResolvedValue(new Map())
    const xml = await generateNewsSitemapXml()
    expect(XMLValidator.validate(xml)).toBe(true)
    expect(xml).not.toContain("<url>")
    expect(select).toHaveBeenCalledTimes(1)
  })
  it("writes valid escaped news XML with the actual language and original publication date", () => {
    const xml = newsSitemapXml(
      [
        {
          url: "https://news.example/posts/a?x=1&y=2",
          title: 'خبر < & "',
          date: "2026-11-01T10:00:00Z",
          locale: "ar",
        },
      ],
      "Publisher & Co"
    )
    expect(XMLValidator.validate(xml)).toBe(true)
    const result = new XMLParser().parse(xml).urlset.url["news:news"]
    expect(result["news:publication"]["news:language"]).toBe("ar")
    expect(result["news:publication_date"]).toBe("2026-11-01T10:00:00Z")
    expect(result["news:title"]).toBe('خبر < & "')
    expect(newsSitemapXml([], "Publisher")).not.toContain("<url>")
  })
  it("splits by both count and byte budget without dropping records", () => {
    const entries = Array.from({ length: 1001 }, (_, index) => ({
      url: `https://news.example/${index}`,
    }))
    const chunks = splitSitemap(entries, 1000, standardSitemapXml)
    expect(chunks.map((chunk) => chunk.length)).toEqual([1000, 1])
    const byBytes = splitSitemap(
      entries.slice(0, 5),
      1000,
      standardSitemapXml,
      1000
    )
    expect(byBytes.length).toBeGreaterThan(1)
    expect(byBytes.flat()).toEqual(entries.slice(0, 5))
    expect(
      XMLValidator.validate(sitemapIndex(["https://news.example/0.xml"]))
    ).toBe(true)
  })
})
