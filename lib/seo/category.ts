import { localizedSiteOptions } from "@/lib/site-identity"
import type { Metadata } from "next"
import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import {
  wpTerms,
  wpTermTaxonomy,
  termTranslationsTable,
  languagesTable,
} from "@/db/schema"
import { getSeoSite } from "./data"
import { contentUrl } from "./urls"
import { buildSiteMetadata } from "./metadata"
import { contentPlainText } from "@/lib/content-text"

export async function categoryMetadata(
  slug: string,
  locale?: string
): Promise<Metadata> {
  const rawSite = await getSeoSite()
  const site = {
    ...rawSite,
    options: localizedSiteOptions(
      rawSite.options,
      locale || rawSite.defaultLocale,
      rawSite.defaultLocale
    ),
  }
  let decoded = slug
  try {
    decoded = decodeURIComponent(slug)
  } catch {}
  const [match] = await db
    .select({ group: termTranslationsTable.translationGroupId })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .innerJoin(
      termTranslationsTable,
      eq(wpTermTaxonomy.termTaxonomyId, termTranslationsTable.termTaxonomyId)
    )
    .where(
      and(eq(wpTerms.slug, decoded), eq(wpTermTaxonomy.taxonomy, "category"))
    )
    .limit(1)
  if (!match) return { robots: { index: false, follow: true } }
  const rows = await db
    .select({
      slug: wpTerms.slug,
      name: wpTerms.name,
      description: wpTermTaxonomy.description,
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
        eq(termTranslationsTable.translationGroupId, match.group),
        eq(languagesTable.isActive, true)
      )
    )
  const current = rows.find(
    (row) => row.locale === (locale || site.defaultLocale)
  )
  if (!current) return { robots: { index: false, follow: true } }
  const title = contentPlainText(current.name),
    description =
      contentPlainText(current.description) ||
      site.options.seo_default_meta_description
  const canonical = contentUrl(
    site.base,
    "category",
    current.slug,
    current.locale,
    site.defaultLocale
  )
  return {
    ...buildSiteMetadata(site.options),
    title: {
      absolute: (site.options.seo_meta_title_template || "%title%")
        .replaceAll("%title%", title)
        .replaceAll("%sitename%", site.options.blogname),
    },
    description,
    alternates: {
      canonical:
        site.options.seo_canonical_enabled === "0" ? undefined : canonical,
      languages: Object.fromEntries(
        rows.map((row) => [
          row.locale,
          contentUrl(
            site.base,
            "category",
            row.slug,
            row.locale,
            site.defaultLocale
          ),
        ])
      ),
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      locale: current.locale,
      siteName: site.options.blogname,
    },
  }
}
