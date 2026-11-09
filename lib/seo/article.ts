import type { Metadata } from "next"
import type { ContentItem } from "@/lib/site-content"
import {
  getPublishedPostBySlug,
  getPublishedPageBySlug,
  getPublishedPageById,
} from "@/lib/site-content"
import { buildSiteMetadata } from "./metadata"
import { getIndexableTranslations, getPostSeoMap, getSeoSite } from "./data"
import { absoluteWebUrl, contentUrl, mediaUrl } from "./urls"
import { indexingAllowed, seoRobots } from "./metadata"

export function articleCanonical(
  article: ContentItem,
  site: Awaited<ReturnType<typeof getSeoSite>>
) {
  const self = contentUrl(
    site.base,
    "post",
    article.slug,
    article.locale || site.defaultLocale,
    site.defaultLocale
  )
  return site.options.seo_canonical_enabled === "0"
    ? self
    : absoluteWebUrl(article.seo?.canonical, site.base) || self
}

export async function articleMetadata(
  slug: string,
  locale?: string,
  type: "post" | "page" = "post",
  home = false
): Promise<Metadata> {
  const [article, site] = await Promise.all([
    type === "post"
      ? getPublishedPostBySlug(slug, locale)
      : getPublishedPageBySlug(slug, locale),
    getSeoSite(),
  ])
  if (!article) return { robots: { index: false, follow: false } }
  const rows = await getIndexableTranslations(article.id, type)
  const isHome =
    home ||
    (type === "page" &&
      site.options.show_on_front === "page" &&
      rows.some((row) => row.id.toString() === site.options.page_on_front))
  const title =
    article.seo?.title || (isHome ? site.options.blogname : article.title)
  const description =
    article.seo?.description ||
    article.excerpt ||
    site.options.seo_default_meta_description ||
    site.options.blogdescription
  const url = (slug: string, locale: string) =>
    isHome
      ? `${site.base}${locale === site.defaultLocale ? "/" : `/${locale}`}`
      : contentUrl(site.base, type, slug, locale, site.defaultLocale)
  const canonical =
    (site.options.seo_canonical_enabled === "0"
      ? undefined
      : absoluteWebUrl(article.seo?.canonical, site.base)) ||
    url(article.slug, article.locale || site.defaultLocale)
  const seo = await getPostSeoMap(rows.map((row) => row.id))
  const languages: Record<string, string> = {}
  for (const row of rows) {
    const own = url(row.slug, row.locale)
    const override = absoluteWebUrl(
      seo.get(row.id.toString())?.canonical,
      site.base
    )
    if (
      !override ||
      override === own ||
      site.options.seo_canonical_enabled === "0"
    )
      languages[row.locale] = own
  }
  const image = mediaUrl(
    article.seo?.image || article.imageUrl || site.options.og_default_image,
    site.base
  )
  const formatted = (site.options.seo_meta_title_template || "%title%")
    .replaceAll("%title%", title)
    .replaceAll("%sitename%", site.options.blogname)
  return {
    title: { absolute: formatted },
    description,
    alternates: {
      canonical:
        site.options.seo_canonical_enabled === "0" ? undefined : canonical,
      languages,
    },
    robots: seoRobots(site.options, article.seo?.noindex),
    openGraph: {
      type: type === "post" ? "article" : "website",
      url: canonical,
      locale: article.locale,
      alternateLocale: Object.keys(languages).filter(
        (language) => language !== article.locale
      ),
      siteName: site.options.og_site_name || site.options.blogname,
      title,
      description,
      ...(type === "post"
        ? {
            publishedTime: (
              article.publishedDate || article.date
            ).toISOString(),
            modifiedTime: article.modifiedDate?.toISOString(),
            authors: article.authorName ? [article.authorName] : [],
          }
        : {}),
      images: image ? [{ url: image, alt: article.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export async function homepageMetadata(locale?: string): Promise<Metadata> {
  const site = await getSeoSite()
  const active = locale || site.defaultLocale
  if (
    site.options.show_on_front === "page" &&
    /^\d+$/.test(site.options.page_on_front || "")
  ) {
    const page = await getPublishedPageById(site.options.page_on_front, active)
    if (page) return articleMetadata(page.slug, active, "page", true)
  }
  const metadata = buildSiteMetadata(site.options)
  metadata.alternates = {
    canonical:
      site.options.seo_canonical_enabled === "0"
        ? undefined
        : `${site.base}${active === site.defaultLocale ? "/" : `/${active}`}`,
    languages: Object.fromEntries(
      site.languages.map((language) => [
        language.code,
        `${site.base}${language.code === site.defaultLocale ? "/" : `/${language.code}`}`,
      ])
    ),
  }
  return metadata
}

export function newsArticleSchema(
  article: ContentItem,
  site: Awaited<ReturnType<typeof getSeoSite>>
) {
  if (!indexingAllowed(site.options, article.seo?.noindex)) return null
  const canonical = articleCanonical(article, site)
  const image = mediaUrl(
    article.imageUrl || site.options.og_default_image,
    site.base
  )
  const logo = mediaUrl(site.logo?.url || "", site.base)
  const published = article.publishedDate || article.date
  const modified =
    article.modifiedDate && article.modifiedDate >= published
      ? article.modifiedDate
      : undefined
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${canonical}#article`,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    headline: article.title,
    description: article.excerpt,
    datePublished: published.toISOString(),
    ...(modified ? { dateModified: modified.toISOString() } : {}),
    inLanguage: article.locale || site.defaultLocale,
    ...(image ? { image: [image] } : {}),
    ...(article.authorName
      ? { author: [{ "@type": "Person", name: article.authorName }] }
      : {}),
    publisher: {
      "@type": "Organization",
      "@id": `${site.base}/#publisher`,
      name: site.options.blogname,
      url: site.base,
      ...(logo ? { logo: { "@type": "ImageObject", url: logo } } : {}),
    },
    articleSection: article.categories,
  }
}
