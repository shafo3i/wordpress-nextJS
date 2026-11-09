import type { MetadataRoute } from "next"
import { cache } from "react"
import { and, desc, eq, inArray, gte } from "drizzle-orm"
import { db } from "@/db"
import {
  wpPosts,
  wpTerms,
  wpTermTaxonomy,
  postTranslationsTable,
  termTranslationsTable,
  languagesTable,
} from "@/db/schema"
import { getSeoSite, getPostSeoMap, indexablePostWhere } from "@/lib/seo/data"
import { indexingAllowed } from "@/lib/seo/metadata"
import {
  absoluteWebUrl,
  contentUrl,
  mediaUrl,
  escapeXml,
  publicationLanguage,
} from "@/lib/seo/urls"
import { contentPlainText } from "@/lib/content-text"
import { getPostImageAssets } from "@/services/media-images.service"

export const NEWS_SITEMAP_LIMIT = 1000
export const STANDARD_SITEMAP_LIMIT = 50000
export async function getBaseSiteUrl() {
  return (await getSeoSite()).base
}

export const getSitemapBundle = cache(async () => {
  const site = await getSeoSite()
  if (!indexingAllowed(site.options))
    return {
      site,
      entries: [] as MetadataRoute.Sitemap,
      news: [] as NewsEntry[],
      counts: { posts: 0, pages: 0, categories: 0 },
    }
  const now = new Date()
  const [rows, categories] = await Promise.all([
    db
      .select({
        id: wpPosts.id,
        type: wpPosts.postType,
        slug: wpPosts.postName,
        title: wpPosts.postTitle,
        date: wpPosts.postDateGmt,
        modified: wpPosts.postModifiedGmt,
        locale: postTranslationsTable.languageCode,
        group: postTranslationsTable.translationGroupId,
      })
      .from(wpPosts)
      .innerJoin(
        postTranslationsTable,
        eq(wpPosts.id, postTranslationsTable.postId)
      )
      .innerJoin(
        languagesTable,
        eq(postTranslationsTable.languageCode, languagesTable.code)
      )
      .where(
        and(
          indexablePostWhere(now),
          inArray(wpPosts.postType, ["post", "page"])
        )
      )
      .orderBy(desc(wpPosts.postDateGmt), desc(wpPosts.id)),
    db
      .select({
        slug: wpTerms.slug,
        locale: termTranslationsTable.languageCode,
      })
      .from(wpTerms)
      .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
      .innerJoin(
        termTranslationsTable,
        eq(wpTermTaxonomy.termTaxonomyId, termTranslationsTable.termTaxonomyId)
      )
      .innerJoin(
        languagesTable,
        eq(termTranslationsTable.languageCode, languagesTable.code)
      )
      .where(
        and(
          eq(wpTermTaxonomy.taxonomy, "category"),
          eq(languagesTable.isActive, true)
        )
      ),
  ])
  const [seo, images] = await Promise.all([
    getPostSeoMap(rows.map((row) => row.id)),
    getPostImageAssets(
      rows.filter((row) => row.type === "post").map((row) => row.id)
    ),
  ])
  const eligible = rows.filter((row) => {
    const own = contentUrl(
      site.base,
      row.type,
      row.slug,
      row.locale,
      site.defaultLocale
    )
    const canonical = absoluteWebUrl(
      seo.get(row.id.toString())?.canonical,
      site.base
    )
    return (
      site.options.seo_canonical_enabled === "0" ||
      !canonical ||
      canonical === own
    )
  })
  const front =
    site.options.show_on_front === "page" &&
    /^\d+$/.test(site.options.page_on_front || "")
      ? await db
          .select({ group: postTranslationsTable.translationGroupId })
          .from(postTranslationsTable)
          .where(
            eq(postTranslationsTable.postId, BigInt(site.options.page_on_front))
          )
          .limit(1)
      : []
  const homeGroup = front[0]?.group
  const groups = new Map<string, Record<string, string>>()
  const rowUrl = (row: (typeof rows)[number]) =>
    homeGroup && row.type === "page" && row.group === homeGroup
      ? `${site.base}${row.locale === site.defaultLocale ? "/" : `/${row.locale}`}`
      : contentUrl(
          site.base,
          row.type,
          row.slug,
          row.locale,
          site.defaultLocale
        )
  for (const row of eligible) {
    const key = `${row.type}:${row.group}`
    const values = groups.get(key) || {}
    values[row.locale] = rowUrl(row)
    groups.set(key, values)
  }
  const homeLanguages = site.languages.filter(
    (language) =>
      !homeGroup ||
      eligible.some(
        (row) =>
          row.type === "page" &&
          row.group === homeGroup &&
          row.locale === language.code
      )
  )
  const entries: MetadataRoute.Sitemap = homeLanguages.map((language) => ({
    url:
      language.code === site.defaultLocale
        ? `${site.base}/`
        : `${site.base}/${language.code}`,
    alternates: {
      languages: Object.fromEntries(
        homeLanguages.map((other) => [
          other.code,
          other.code === site.defaultLocale
            ? `${site.base}/`
            : `${site.base}/${other.code}`,
        ])
      ),
    },
  }))
  for (const category of categories)
    entries.push({
      url: contentUrl(
        site.base,
        "category",
        category.slug,
        category.locale,
        site.defaultLocale
      ),
    })
  const news: NewsEntry[] = []
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  for (const row of eligible) {
    const image = mediaUrl(images.get(row.id.toString())?.url || "", site.base)
    const url = rowUrl(row)
    entries.push({
      url,
      lastModified: row.modified >= row.date ? row.modified : row.date,
      alternates: { languages: groups.get(`${row.type}:${row.group}`) },
      ...(image ? { images: [image] } : {}),
    })
    if (row.type === "post" && row.date >= cutoff && row.date <= now)
      news.push({
        url,
        title: contentPlainText(row.title),
        date: row.date.toISOString(),
        locale: row.locale,
      })
  }
  return {
    site,
    entries: [...new Map(entries.map((entry) => [entry.url, entry])).values()],
    news,
    counts: {
      posts: eligible.filter((row) => row.type === "post").length,
      pages: eligible.filter((row) => row.type === "page").length,
      categories: categories.length,
    },
  }
})

type NewsEntry = { url: string; title: string; date: string; locale: string }
export function splitSitemap<T>(
  items: T[],
  limit: number,
  render: (items: T[]) => string,
  maxBytes = 45 * 1024 * 1024
): T[][] {
  const chunks: T[][] = [[]]
  let bytes = 0
  for (const item of items) {
    const size = Buffer.byteLength(render([item]), "utf8")
    if (
      chunks[chunks.length - 1].length &&
      (chunks[chunks.length - 1].length >= limit || bytes + size > maxBytes)
    ) {
      chunks.push([])
      bytes = 0
    }
    chunks[chunks.length - 1].push(item)
    bytes += size
  }
  return chunks
}
export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  return (await getSitemapBundle()).entries
}

export function sitemapIndex(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join("")}</sitemapindex>`
}

export function standardSitemapXml(entries: MetadataRoute.Sitemap) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries
    .map(
      (entry) =>
        `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${escapeXml(new Date(entry.lastModified).toISOString())}</lastmod>` : ""}${Object.entries(
          entry.alternates?.languages || {}
        )
          .map(
            ([language, url]) =>
              `<xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(String(url))}"/>`
          )
          .join(
            ""
          )}${(entry.images || []).map((url) => `<image:image><image:loc>${escapeXml(url)}</image:loc></image:image>`).join("")}</url>`
    )
    .join("")}</urlset>`
}

export function newsSitemapXml(entries: NewsEntry[], publication: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries.map((entry) => `<url><loc>${escapeXml(entry.url)}</loc><news:news><news:publication><news:name>${escapeXml(publication)}</news:name><news:language>${escapeXml(publicationLanguage(entry.locale))}</news:language></news:publication><news:publication_date>${escapeXml(entry.date)}</news:publication_date><news:title>${escapeXml(entry.title)}</news:title></news:news></url>`).join("")}</urlset>`
}

export async function generateNewsSitemapXml(part?: number): Promise<string> {
  const site = await getSeoSite()
  const now = new Date()
  const rows = indexingAllowed(site.options)
    ? await db
        .select({
          id: wpPosts.id,
          slug: wpPosts.postName,
          title: wpPosts.postTitle,
          date: wpPosts.postDateGmt,
          locale: postTranslationsTable.languageCode,
        })
        .from(wpPosts)
        .innerJoin(
          postTranslationsTable,
          eq(wpPosts.id, postTranslationsTable.postId)
        )
        .innerJoin(
          languagesTable,
          eq(postTranslationsTable.languageCode, languagesTable.code)
        )
        .where(
          and(
            indexablePostWhere(now),
            eq(wpPosts.postType, "post"),
            gte(
              wpPosts.postDateGmt,
              new Date(now.getTime() - 48 * 60 * 60 * 1000)
            )
          )
        )
        .orderBy(desc(wpPosts.postDateGmt), desc(wpPosts.id))
    : []
  const seo = await getPostSeoMap(rows.map((row) => row.id))
  const news: NewsEntry[] = rows.flatMap((row) => {
    const url = contentUrl(
      site.base,
      "post",
      row.slug,
      row.locale,
      site.defaultLocale
    )
    const canonical = absoluteWebUrl(
      seo.get(row.id.toString())?.canonical,
      site.base
    )
    return site.options.seo_canonical_enabled !== "0" &&
      canonical &&
      canonical !== url
      ? []
      : [
          {
            url,
            title: contentPlainText(row.title),
            date: row.date.toISOString(),
            locale: row.locale,
          },
        ]
  })
  const chunks = splitSitemap(news, NEWS_SITEMAP_LIMIT, (items) =>
    newsSitemapXml(items, site.options.blogname)
  )
  if (part !== undefined && part >= chunks.length)
    throw new RangeError("Sitemap part not found")
  if (part === undefined && chunks.length > 1)
    return sitemapIndex(
      chunks.map((_, index) => `${site.base}/news-sitemap/${index}.xml`)
    )
  return newsSitemapXml(chunks[part || 0], site.options.blogname)
}

export async function generateStandardSitemapXml(
  part?: number
): Promise<string> {
  const { site, entries } = await getSitemapBundle()
  const chunks = splitSitemap(
    entries,
    STANDARD_SITEMAP_LIMIT,
    standardSitemapXml
  )
  if (part !== undefined && part >= chunks.length)
    throw new RangeError("Sitemap part not found")
  if (part === undefined && chunks.length > 1)
    return sitemapIndex(
      chunks.map((_, index) => `${site.base}/sitemaps/${index}.xml`)
    )
  return standardSitemapXml(chunks[part || 0])
}

export async function getSitemapStats() {
  const { counts, entries } = await getSitemapBundle()
  return {
    indexedPosts: counts.posts,
    indexedPages: counts.pages,
    indexedCategories: counts.categories,
    totalUrls: entries.length,
  }
}
