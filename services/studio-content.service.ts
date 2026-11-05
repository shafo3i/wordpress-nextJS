import { and, asc, desc, eq, exists, inArray, count } from "drizzle-orm"
import { db, type DB } from "@/db"
import {
  wpPosts,
  wpPostmeta,
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  user,
  postTranslationsTable,
  languagesTable,
  termTranslationsTable,
} from "@/db/schema"
import { studioContentRequestSchema } from "@/db/schema/cms-studio-content"
import {
  getStudioDocumentRequests,
  studioContentRequestKey,
  type StudioCategory,
  type StudioContentResult,
  type StudioContentSnapshot,
} from "@/lib/studio/content"
import type { ContentItem } from "@/lib/site-content"
import type { StudioDocumentData } from "@/lib/studio/types"
import { getSafeStudioUrl } from "@/lib/studio/urls"

export class StudioContentError extends Error {}

export async function getStudioCategories(
  database: DB = db
): Promise<StudioCategory[]> {
  const rows = await database
    .select({
      id: wpTermTaxonomy.termTaxonomyId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      locale: termTranslationsTable.languageCode,
      translationGroupId: termTranslationsTable.translationGroupId,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .leftJoin(
      termTranslationsTable,
      eq(termTranslationsTable.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
    )
    .where(eq(wpTermTaxonomy.taxonomy, "category"))
    .orderBy(asc(wpTermTaxonomy.termTaxonomyId))
  return rows.map((row) => ({ ...row, id: row.id.toString() }))
}

export async function getStudioWidgetContent(
  raw: unknown,
  database: DB = db
): Promise<StudioContentResult> {
  const request = studioContentRequestSchema.parse(raw)
  const [language] = await database
    .select({ code: languagesTable.code, direction: languagesTable.direction })
    .from(languagesTable)
    .where(
      and(
        eq(languagesTable.code, request.locale),
        eq(languagesTable.isActive, true)
      )
    )
    .limit(1)
  if (!language) throw new StudioContentError("invalid_locale")
  const result: StudioContentResult = {
    items: [],
    total: 0,
    page: request.page,
    pageSize: request.pageSize,
    locale: request.locale,
    direction: language.direction === "rtl" ? "rtl" : "ltr",
    category: null,
    categoryMissing: false,
  }
  let categoryIds: bigint[] | undefined
  if (request.categoryId || request.categorySlug !== "all") {
    const categories = await getStudioCategories(database)
    const source = request.categoryId
      ? categories.find((category) => category.id === request.categoryId)
      : categories.find((category) => category.slug === request.categorySlug)
    if (!source) return { ...result, categoryMissing: true }
    const linked = source.translationGroupId
      ? categories.filter(
          (category) =>
            category.translationGroupId === source.translationGroupId
        )
      : [source]
    result.category =
      linked.find((category) => category.locale === request.locale) || source
    // Group identity handles translated slugs and legacy assignments without changing topics.
    categoryIds = linked.map((category) => BigInt(category.id))
  }
  const conditions = [
    eq(wpPosts.postType, "post"),
    eq(wpPosts.postStatus, "publish"),
    eq(postTranslationsTable.languageCode, request.locale),
  ]
  if (categoryIds)
    conditions.push(
      exists(
        database
          .select({ id: wpTermRelationships.objectId })
          .from(wpTermRelationships)
          .where(
            and(
              eq(wpTermRelationships.objectId, wpPosts.id),
              inArray(wpTermRelationships.termTaxonomyId, categoryIds)
            )
          )
      )
    )
  if (request.featuredOnly)
    conditions.push(
      exists(
        database
          .select({ id: wpPostmeta.metaId })
          .from(wpPostmeta)
          .where(
            and(
              eq(wpPostmeta.postId, wpPosts.id),
              eq(wpPostmeta.metaKey, "_is_featured"),
              eq(wpPostmeta.metaValue, "1")
            )
          )
      )
    )
  const where = and(...conditions)
  const [rows, totals] = await Promise.all([
    database
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        slug: wpPosts.postName,
        excerpt: wpPosts.postExcerpt,
        content: wpPosts.postContent,
        date: wpPosts.postDate,
        authorName: user.name,
      })
      .from(wpPosts)
      .innerJoin(
        postTranslationsTable,
        eq(postTranslationsTable.postId, wpPosts.id)
      )
      .leftJoin(user, eq(user.id, wpPosts.postAuthor))
      .where(where)
      .orderBy(
        request.sort === "oldest"
          ? asc(wpPosts.postDate)
          : desc(wpPosts.postDate),
        request.sort === "oldest" ? asc(wpPosts.id) : desc(wpPosts.id)
      )
      .limit(request.pageSize)
      .offset((request.page - 1) * request.pageSize),
    database
      .select({ total: count() })
      .from(wpPosts)
      .innerJoin(
        postTranslationsTable,
        eq(postTranslationsTable.postId, wpPosts.id)
      )
      .where(where),
  ])
  result.total = Number(totals[0]?.total || 0)
  if (!rows.length) return result
  const ids = rows.map((row) => row.id)
  const [terms, metadata] = await Promise.all([
    database
      .select({
        postId: wpTermRelationships.objectId,
        taxonomy: wpTermTaxonomy.taxonomy,
        name: wpTerms.name,
      })
      .from(wpTermRelationships)
      .innerJoin(
        wpTermTaxonomy,
        eq(wpTermTaxonomy.termTaxonomyId, wpTermRelationships.termTaxonomyId)
      )
      .innerJoin(wpTerms, eq(wpTerms.termId, wpTermTaxonomy.termId))
      .where(inArray(wpTermRelationships.objectId, ids)),
    database
      .select({
        postId: wpPostmeta.postId,
        key: wpPostmeta.metaKey,
        value: wpPostmeta.metaValue,
      })
      .from(wpPostmeta)
      .where(
        and(
          inArray(wpPostmeta.postId, ids),
          inArray(wpPostmeta.metaKey, ["_thumbnail_id", "_is_featured"])
        )
      ),
  ])
  const thumbnails = metadata.filter(
    (meta) =>
      meta.key === "_thumbnail_id" &&
      /^[1-9][0-9]{0,18}$/.test(meta.value || "")
  )
  const attachments = thumbnails.length
    ? await database
        .select({ id: wpPosts.id, url: wpPosts.guid })
        .from(wpPosts)
        .where(
          and(
            inArray(
              wpPosts.id,
              thumbnails.map((meta) => BigInt(meta.value!))
            ),
            eq(wpPosts.postType, "attachment")
          )
        )
    : []
  const imageMap = new Map(
    attachments.map((image) => [
      image.id.toString(),
      getSafeStudioUrl(image.url, true),
    ])
  )
  result.items = rows.map((row) => ({
    id: row.id.toString(),
    title: row.title,
    slug: row.slug,
    excerpt:
      row.excerpt ||
      row.content
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180),
    content: "",
    date: row.date,
    authorName: row.authorName || "",
    categories: terms
      .filter((term) => term.postId === row.id && term.taxonomy === "category")
      .map((term) => term.name),
    tags: terms
      .filter((term) => term.postId === row.id && term.taxonomy === "post_tag")
      .map((term) => term.name),
    imageUrl:
      imageMap.get(
        thumbnails.find((meta) => meta.postId === row.id)?.value || ""
      ) || "",
    isFeatured: metadata.some(
      (meta) =>
        meta.postId === row.id &&
        meta.key === "_is_featured" &&
        meta.value === "1"
    ),
    locale: request.locale,
    direction: result.direction,
  }))
  return result
}

export async function getStudioDocumentContent(
  document: StudioDocumentData,
  locale: string,
  database: DB = db
): Promise<StudioContentSnapshot> {
  const requests = getStudioDocumentRequests(document, locale)
  const snapshot: StudioContentSnapshot = { requests: {} }
  for (const request of requests.slice(50))
    (snapshot.errors ||= {})[studioContentRequestKey(request)] =
      "too_many_feeds"
  for (let offset = 0; offset < Math.min(requests.length, 50); offset += 4)
    await Promise.all(
      requests.slice(offset, Math.min(offset + 4, 50)).map(async (request) => {
        const key = studioContentRequestKey(request)
        try {
          snapshot.requests[key] = await getStudioWidgetContent(
            request,
            database
          )
        } catch (error) {
          if (!(error instanceof StudioContentError)) throw error
          ;(snapshot.errors ||= {})[key] = error.message
        }
      })
    )
  return snapshot
}

export async function resolveStudioPageContent(
  page: ContentItem,
  locale: string
): Promise<ContentItem> {
  return page.studioEnabled && page.studioDocument
    ? {
        ...page,
        studioContent: await getStudioDocumentContent(
          page.studioDocument,
          locale
        ),
      }
    : page
}
