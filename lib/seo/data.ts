import { cache } from "react"
import { and, desc, eq, inArray, lte, ne, sql } from "drizzle-orm"
import { db } from "@/db"
import {
  languagesTable,
  postTranslationsTable,
  wpPosts,
  wpPostmeta,
} from "@/db/schema"
import { getSiteSeoOptions } from "@/services/settings.service"
import { getActiveLanguages } from "@/services/language.service"
import { getGlobalSiteLogo } from "@/services/site-logo.service"
import { siteBaseUrl } from "./urls"
import type { ContentItem } from "@/lib/site-content"

export const getSeoSite = cache(async () => {
  const [options, languages, logo] = await Promise.all([
    getSiteSeoOptions(),
    getActiveLanguages().catch(() => []),
    getGlobalSiteLogo().catch(() => null),
  ])
  return {
    options,
    languages,
    logo,
    base: siteBaseUrl(options),
    defaultLocale:
      languages.find((language) => language.isDefault)?.code ||
      languages[0]?.code ||
      "en",
  }
})

export async function getPostSeoMap(ids: Array<string | bigint>) {
  const result = new Map<string, NonNullable<ContentItem["seo"]>>()
  for (let start = 0; start < ids.length; start += 500) {
    const rows = await db
      .select({
        id: wpPostmeta.postId,
        key: wpPostmeta.metaKey,
        value: wpPostmeta.metaValue,
      })
      .from(wpPostmeta)
      .where(
        and(
          inArray(
            wpPostmeta.postId,
            ids.slice(start, start + 500).map((id) => BigInt(id))
          ),
          inArray(wpPostmeta.metaKey, [
            "_seo_title",
            "_seo_description",
            "_seo_og_image",
            "_seo_canonical",
            "_seo_noindex",
          ])
        )
      )
      .orderBy(desc(wpPostmeta.metaId))
    for (const row of rows) {
      const id = row.id.toString(),
        seo = result.get(id) || {}
      if (row.key === "_seo_title" && seo.title === undefined)
        seo.title = row.value || ""
      if (row.key === "_seo_description" && seo.description === undefined)
        seo.description = row.value || ""
      if (row.key === "_seo_og_image" && seo.image === undefined)
        seo.image = row.value || ""
      if (row.key === "_seo_canonical" && seo.canonical === undefined)
        seo.canonical = row.value || ""
      if (row.key === "_seo_noindex" && seo.noindex === undefined)
        seo.noindex = row.value === "1"
      result.set(id, seo)
    }
  }
  return result
}

export function indexablePostWhere(now = new Date()) {
  return and(
    eq(wpPosts.postStatus, "publish"),
    eq(wpPosts.postPassword, ""),
    lte(wpPosts.postDateGmt, now),
    ne(wpPosts.postName, ""),
    eq(languagesTable.isActive, true),
    sql`not exists (select 1 from ${wpPostmeta} where ${wpPostmeta.postId}=${wpPosts.id} and ${wpPostmeta.metaKey}='_seo_noindex' and ${wpPostmeta.metaValue}='1')`
  )
}

export const getIndexableTranslations = cache(
  async (postId: string, type = "post") =>
    db
      .select({
        id: wpPosts.id,
        slug: wpPosts.postName,
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
          indexablePostWhere(),
          eq(wpPosts.postType, type),
          sql`${postTranslationsTable.translationGroupId} in (select translation_group_id from cms_post_translations where post_id=${BigInt(postId)})`
        )
      )
)
