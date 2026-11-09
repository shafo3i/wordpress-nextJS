import { afterEach, describe, expect, it, vi } from "vitest"
const { article, site, translations, seoMap } = vi.hoisted(() => ({
  article: vi.fn(),
  site: vi.fn(),
  translations: vi.fn(),
  seoMap: vi.fn(),
}))
vi.mock("@/lib/site-content", () => ({
  getPublishedPostBySlug: article,
  getPublishedPageBySlug: article,
  getPublishedPageById: article,
}))
vi.mock("./data", () => ({
  getSeoSite: site,
  getIndexableTranslations: translations,
  getPostSeoMap: seoMap,
}))
import { articleMetadata, newsArticleSchema } from "./article"
import type { ContentItem } from "@/lib/site-content"

const post: ContentItem = {
  id: "1",
  slug: "report",
  title: "Actual title",
  excerpt: "Summary",
  content: "",
  date: new Date("2026-11-01T10:00:00Z"),
  modifiedDate: new Date("2026-11-02T10:00:00Z"),
  authorName: "Actual author",
  categories: ["News"],
  tags: [],
  imageUrl: "/uploads/report.jpg",
  locale: "ar",
  seo: { title: "SEO title", description: "SEO description" },
}
const context = {
  base: "https://news.example",
  defaultLocale: "ar",
  languages: [],
  logo: { id: "2", url: "/uploads/logo.png" },
  options: {
    blogname: "Publisher",
    blog_public: "1",
    seo_canonical_enabled: "1",
    seo_robots_extra: "max-image-preview:large",
    seo_meta_title_template: "%title% | %sitename%",
  },
}
afterEach(() => vi.clearAllMocks())
describe("article SEO", () => {
  it("honors saved overrides with consistent multilingual metadata", async () => {
    article.mockResolvedValue(post)
    site.mockResolvedValue(context)
    translations.mockResolvedValue([
      { id: BigInt(1), slug: "report", locale: "ar" },
      { id: BigInt(2), slug: "translated", locale: "en" },
    ])
    seoMap.mockResolvedValue(new Map())
    const metadata = await articleMetadata("report", "ar")
    expect(metadata.title).toEqual({ absolute: "SEO title | Publisher" })
    expect(metadata.description).toBe("SEO description")
    expect(metadata.alternates).toEqual({
      canonical: "https://news.example/posts/report",
      languages: {
        ar: "https://news.example/posts/report",
        en: "https://news.example/en/posts/translated",
      },
    })
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      modifiedTime: "2026-11-02T10:00:00.000Z",
    })
  })
  it("uses actual article information, rather than SEO titles or invented dates/authors, in schema", () => {
    const schema = newsArticleSchema(post, context)
    expect(schema).toMatchObject({
      "@type": "NewsArticle",
      headline: "Actual title",
      datePublished: "2026-11-01T10:00:00.000Z",
      dateModified: "2026-11-02T10:00:00.000Z",
      inLanguage: "ar",
      image: ["https://news.example/uploads/report.jpg"],
      author: [{ name: "Actual author" }],
      publisher: {
        name: "Publisher",
        logo: { url: "https://news.example/uploads/logo.png" },
      },
    })
    expect(
      newsArticleSchema({ ...post, authorName: "" }, context)
    ).not.toHaveProperty("author")
    expect(
      newsArticleSchema({ ...post, seo: { noindex: true } }, context)
    ).toBeNull()
    expect(
      newsArticleSchema(post, {
        ...context,
        options: { ...context.options, blog_public: "0" },
      })
    ).toBeNull()
  })
})
