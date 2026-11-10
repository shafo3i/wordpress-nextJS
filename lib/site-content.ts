import { getRelatedPublishedPostIds } from "@/services/related-posts.service"
import { isVideoPost } from "@/lib/post-video"
import { contentPlainText } from "@/lib/content-text"
import { getPostViewCounts } from "@/services/post-views.service"
import { and, desc, eq, inArray, countDistinct, lte } from "drizzle-orm"
import { cache } from "react"
import { getPostImageAssets } from "@/services/media-images.service"
import { getPostSeoMap } from "@/lib/seo/data"
import { db } from "@/db"
import {
  wpPosts,
  wpPostmeta,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
  user,
  postTranslationsTable,
  languagesTable,
  termTranslationsTable,
} from "@/db/schema"
import { getDefaultLanguage } from "@/services/language.service"
import { parseStudioDocument } from "@/lib/studio/tree-helpers"
import type { StudioDocumentData } from "@/lib/studio/types"
import type { StudioContentSnapshot } from "@/lib/studio/content"

export type ContentItem = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  date: Date
  authorName: string
  categories: string[]
  tags: string[]
  hasVideo?: boolean
  imageUrl: string
  imageWidth?: number
  imageHeight?: number
  imageSrcSet?: string
  modifiedDate?: Date
  publishedDate?: Date
  authorId?: string
  seo?: {
    title?: string
    description?: string
    image?: string
    canonical?: string
    noindex?: boolean
  }
  commentCount?: number
  viewCount?: number
  isFeatured?: boolean
  template?: string
  locale?: string
  direction?: "ltr" | "rtl"
  studioEnabled?: boolean
  studioDocument?: StudioDocumentData
  studioContent?: StudioContentSnapshot
}

async function getTermData(postIds: bigint[] | string[]) {
  if (!postIds.length)
    return new Map<
      string,
      { categories: string[]; tags: string[]; hasVideo?: boolean }
    >()

  const rows = await db
    .select({
      objectId: wpTermRelationships.objectId,
      taxonomy: wpTermTaxonomy.taxonomy,
      name: wpTerms.name,
      termSlug: wpTerms.slug,
    })
    .from(wpTermRelationships)
    .innerJoin(
      wpTermTaxonomy,
      eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
    )
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
    .where(
      inArray(
        wpTermRelationships.objectId,
        postIds.map((id) => BigInt(id))
      )
    )

  const map = new Map<
    string,
    { categories: string[]; tags: string[]; hasVideo?: boolean }
  >()
  for (const row of rows) {
    const key = row.objectId.toString()
    const existing = map.get(key) ?? { categories: [], tags: [] }
    if (row.taxonomy === "category")
      existing.categories.push(contentPlainText(row.name))
    if (row.taxonomy === "post_tag")
      existing.tags.push(contentPlainText(row.name))
    if (
      row.taxonomy === "category" &&
      isVideoPost({ categories: [row.name], categorySlugs: [row.termSlug] })
    )
      existing.hasVideo = true
    map.set(key, existing)
  }

  return map
}

async function getFeaturedPostFlags(postIds: bigint[] | string[]) {
  if (!postIds.length) return new Set<string>()
  try {
    const metas = await db
      .select({
        postId: wpPostmeta.postId,
        metaValue: wpPostmeta.metaValue,
      })
      .from(wpPostmeta)
      .where(
        and(
          inArray(
            wpPostmeta.postId,
            postIds.map((id) => BigInt(id))
          ),
          eq(wpPostmeta.metaKey, "_is_featured")
        )
      )
    const set = new Set<string>()
    for (const m of metas) {
      if (m.metaValue === "1") {
        set.add(m.postId.toString())
      }
    }
    return set
  } catch {
    return new Set<string>()
  }
}

async function getPageTemplateData(postIds: bigint[] | string[]) {
  if (!postIds.length) return new Map<string, string>()
  try {
    const metas = await db
      .select({
        postId: wpPostmeta.postId,
        metaValue: wpPostmeta.metaValue,
      })
      .from(wpPostmeta)
      .where(
        and(
          inArray(
            wpPostmeta.postId,
            postIds.map((id) => BigInt(id))
          ),
          eq(wpPostmeta.metaKey, "_wp_page_template")
        )
      )

    const map = new Map<string, string>()
    for (const m of metas) {
      if (m.metaValue) {
        map.set(m.postId.toString(), m.metaValue)
      }
    }
    return map
  } catch {
    return new Map<string, string>()
  }
}

async function getStudioPageData(postIds: bigint[] | string[]) {
  if (!postIds.length) {
    return new Map<string, { enabled: boolean; document: StudioDocumentData }>()
  }
  try {
    const metas = await db
      .select({
        postId: wpPostmeta.postId,
        metaKey: wpPostmeta.metaKey,
        metaValue: wpPostmeta.metaValue,
      })
      .from(wpPostmeta)
      .where(
        and(
          inArray(
            wpPostmeta.postId,
            postIds.map((id) => BigInt(id))
          ),
          inArray(wpPostmeta.metaKey, ["_studio_edit_mode", "_studio_data"])
        )
      )

    const map = new Map<
      string,
      { enabled: boolean; document: StudioDocumentData }
    >()
    for (const id of postIds) {
      const idStr = id.toString()
      const modeRow = metas.find(
        (m) =>
          m.postId.toString() === idStr && m.metaKey === "_studio_edit_mode"
      )
      const dataRow = metas.find(
        (m) => m.postId.toString() === idStr && m.metaKey === "_studio_data"
      )
      if (modeRow?.metaValue === "builder" || dataRow?.metaValue) {
        map.set(idStr, {
          enabled: modeRow?.metaValue === "builder",
          document: parseStudioDocument(dataRow?.metaValue),
        })
      }
    }
    return map
  } catch {
    return new Map<string, { enabled: boolean; document: StudioDocumentData }>()
  }
}

function decodeContentSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

export async function getPublishedContent(
  type: "post" | "page",
  slug?: string,
  limit = 10,
  locale?: string,
  selectedPostIds?: bigint[]
) {
  if (selectedPostIds && !selectedPostIds.length) return []
  let effectiveLocale = locale
  if (!effectiveLocale) {
    const defaultLang = await getDefaultLanguage().catch(() => null)
    effectiveLocale = defaultLang?.code || "en"
  }

  const base = await db
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      slug: wpPosts.postName,
      excerpt: wpPosts.postExcerpt,
      content: wpPosts.postContent,
      date: wpPosts.postDate,
      modifiedDate: wpPosts.postModifiedGmt,
      publishedDate: wpPosts.postDateGmt,
      authorId: wpPosts.postAuthor,
      authorName: user.name,
      locale: postTranslationsTable.languageCode,
      direction: languagesTable.direction,
    })
    .from(wpPosts)
    .innerJoin(
      postTranslationsTable,
      eq(wpPosts.id, postTranslationsTable.postId)
    )
    .leftJoin(
      languagesTable,
      eq(postTranslationsTable.languageCode, languagesTable.code)
    )
    .leftJoin(user, eq(wpPosts.postAuthor, user.id))
    .where(
      and(
        eq(wpPosts.postType, type),
        eq(wpPosts.postStatus, "publish"),
        eq(wpPosts.postPassword, ""),
        lte(wpPosts.postDateGmt, new Date()),
        eq(postTranslationsTable.languageCode, effectiveLocale),
        eq(languagesTable.isActive, true),
        selectedPostIds ? inArray(wpPosts.id, selectedPostIds) : undefined,
        slug ? eq(wpPosts.postName, decodeContentSlug(slug)) : undefined
      )
    )
    .orderBy(desc(wpPosts.postDate), desc(wpPosts.id))
    .limit(limit)

  if (!base.length) {
    return []
  }

  const postIds = base.map((item) => item.id.toString())
  const [
    termMap,
    imageMap,
    templateMap,
    studioMap,
    featuredSet,
    viewCounts,
    seoMap,
  ] = await Promise.all([
    getTermData(postIds),
    getPostImageAssets(postIds),
    getPageTemplateData(postIds),
    type === "page" ? getStudioPageData(postIds) : Promise.resolve(new Map()),
    type === "post"
      ? getFeaturedPostFlags(postIds)
      : Promise.resolve(new Set<string>()),
    type === "post"
      ? getPostViewCounts(postIds)
      : Promise.resolve(new Map<string, number>()),
    getPostSeoMap(postIds),
  ])

  return base.map((item) => {
    // Check if postContent contains an <img> tag
    let contentImg = ""
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (match && match[1]) {
      contentImg = match[1]
    }

    const idStr = item.id.toString()
    const attachedImage = imageMap.get(idStr)
    const attachedImg = attachedImage?.url
    const resolvedImg = attachedImg || contentImg || ""
    const studioInfo = studioMap.get(idStr)
    const cats = termMap.get(idStr)?.categories ?? []
    const postTags = termMap.get(idStr)?.tags ?? []
    const isFeaturedByTerm =
      cats.some((c) => /featured|spotlight|مميز|بارز/i.test(c)) ||
      postTags.some((t) => /featured|spotlight|مميز|بارز/i.test(t))

    return {
      id: idStr,
      viewCount: viewCounts.get(idStr) || 0,
      title: contentPlainText(item.title || ""),
      slug: item.slug || "untitled",
      excerpt: contentPlainText(item.excerpt || item.content).slice(0, 180),
      content: item.content || "",
      hasVideo: isVideoPost({
        content: item.content,
        hasVideo: termMap.get(item.id.toString())?.hasVideo,
      }),
      date: item.date,
      publishedDate: item.publishedDate,
      modifiedDate: item.modifiedDate,
      authorId: item.authorId || undefined,
      imageWidth: attachedImage?.width,
      imageHeight: attachedImage?.height,
      imageSrcSet: attachedImage?.srcSet,
      seo: seoMap.get(idStr),
      authorName: item.authorName || "",
      categories: cats,
      tags: postTags,
      imageUrl: resolvedImg,
      isFeatured: featuredSet.has(idStr) || isFeaturedByTerm,
      template: templateMap.get(idStr) || "default",
      locale: item.locale || undefined,
      direction: (item.direction as "ltr" | "rtl") || undefined,
      studioEnabled: studioInfo?.enabled ?? false,
      studioDocument: studioInfo?.document,
    }
  })
}

export async function getPublishedPosts(limit = 12, locale?: string) {
  return await getPublishedContent("post", undefined, limit, locale)
}

export const getPublishedPageBySlug = cache(
  async (slug: string, locale?: string) => {
    const pages = await getPublishedContent("page", slug, 1, locale)
    return pages.length ? pages[0] : null
  }
)

async function readPublishedPageById(
  id: string | number | bigint,
  locale?: string
): Promise<ContentItem | null> {
  if (!id) return null
  let targetId: bigint
  try {
    targetId = BigInt(id)
  } catch {
    return null
  }

  const effectiveLocale = locale || (await getDefaultLanguage())?.code || "en"

  // The root homepage must resolve its translation just like a prefixed route.
  if (effectiveLocale) {
    const transRows = await db
      .select({
        translationGroupId: postTranslationsTable.translationGroupId,
        languageCode: postTranslationsTable.languageCode,
      })
      .from(postTranslationsTable)
      .where(eq(postTranslationsTable.postId, targetId))
      .limit(1)

    if (
      transRows[0]?.translationGroupId &&
      transRows[0].languageCode !== effectiveLocale
    ) {
      const sibling = await db
        .select({ postId: postTranslationsTable.postId })
        .from(postTranslationsTable)
        .innerJoin(wpPosts, eq(postTranslationsTable.postId, wpPosts.id))
        .where(
          and(
            eq(
              postTranslationsTable.translationGroupId,
              transRows[0].translationGroupId
            ),
            eq(postTranslationsTable.languageCode, effectiveLocale),
            eq(wpPosts.postType, "page"),
            eq(wpPosts.postStatus, "publish")
          )
        )
        .limit(1)

      if (sibling[0]?.postId) {
        targetId = sibling[0].postId
      } else return null
    }
    if (
      !transRows[0] ||
      (transRows[0].languageCode !== effectiveLocale &&
        !transRows[0].translationGroupId)
    )
      return null
  }

  const rows = await db
    .select({
      slug: wpPosts.postName,
      locale: postTranslationsTable.languageCode,
    })
    .from(wpPosts)
    .leftJoin(
      postTranslationsTable,
      eq(wpPosts.id, postTranslationsTable.postId)
    )
    .where(
      and(
        eq(wpPosts.id, targetId),
        eq(wpPosts.postType, "page"),
        eq(wpPosts.postStatus, "publish")
      )
    )
    .limit(1)

  if (!rows.length) return null
  return await getPublishedPageBySlug(rows[0].slug, effectiveLocale)
}

export const getPublishedPostBySlug = cache(
  async (slug: string, locale?: string) => {
    const posts = await getPublishedContent("post", slug, 1, locale)
    return posts.length ? posts[0] : null
  }
)

export interface CategoryPostsResult {
  category: {
    id: string
    name: string
    slug: string
    description: string
    count: number
    termTaxonomyId: string
  } | null
  posts: ContentItem[]
  total: number
  totalPages: number
  currentPage: number
}

export async function getPublishedPostsByCategory(
  categorySlug: string,
  page: number = 1,
  limit: number = 10,
  locale?: string
): Promise<CategoryPostsResult> {
  limit = Number.isFinite(limit)
    ? Math.max(1, Math.min(36, Math.trunc(limit)))
    : 12
  let effectiveLocale = locale
  if (!effectiveLocale) {
    const defaultLang = await getDefaultLanguage().catch(() => null)
    effectiveLocale = defaultLang?.code || "en"
  }

  // Find the category term by slug
  const catRows = await db
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
      count: wpTermTaxonomy.count,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(
      and(
        eq(wpTerms.slug, decodeContentSlug(categorySlug)),
        eq(wpTermTaxonomy.taxonomy, "category")
      )
    )
    .limit(1)

  if (!catRows.length) {
    return {
      category: null,
      posts: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    }
  }

  const cat = catRows[0]

  // Find linked term translations if this category is part of a multilingual translation group
  const trGroupRows = await db
    .select({
      translationGroupId: termTranslationsTable.translationGroupId,
    })
    .from(termTranslationsTable)
    .where(eq(termTranslationsTable.termTaxonomyId, cat.termTaxonomyId))
    .limit(1)

  let taxIds: bigint[] = [cat.termTaxonomyId]
  if (trGroupRows[0]?.translationGroupId) {
    const allTaxRows = await db
      .select({ termTaxonomyId: termTranslationsTable.termTaxonomyId })
      .from(termTranslationsTable)
      .where(
        eq(
          termTranslationsTable.translationGroupId,
          trGroupRows[0].translationGroupId
        )
      )
    if (allTaxRows.length) {
      taxIds = allTaxRows.map((r) => r.termTaxonomyId)
    }
  }

  // Count total posts in category for this language
  const [countResult] = await db
    .select({ total: countDistinct(wpPosts.id) })
    .from(wpPosts)
    .innerJoin(
      wpTermRelationships,
      eq(wpPosts.id, wpTermRelationships.objectId)
    )
    .innerJoin(
      postTranslationsTable,
      eq(wpPosts.id, postTranslationsTable.postId)
    )
    .where(
      and(
        eq(wpPosts.postType, "post"),
        eq(wpPosts.postStatus, "publish"),
        eq(wpPosts.postPassword, ""),
        lte(wpPosts.postDateGmt, new Date()),
        eq(postTranslationsTable.languageCode, effectiveLocale),
        inArray(wpTermRelationships.termTaxonomyId, taxIds)
      )
    )

  const total = Number(countResult?.total ?? 0)
  const totalPages = Math.ceil(total / limit)
  const safePage = Math.min(
    Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1),
    totalPages || 1
  )
  const offset = (safePage - 1) * limit

  // Query distinct post IDs matching criteria ordered by postDate
  const postIdsQuery = await db
    .select({
      id: wpPosts.id,
      date: wpPosts.postDate,
    })
    .from(wpPosts)
    .innerJoin(
      wpTermRelationships,
      eq(wpPosts.id, wpTermRelationships.objectId)
    )
    .innerJoin(
      postTranslationsTable,
      eq(wpPosts.id, postTranslationsTable.postId)
    )
    .where(
      and(
        eq(wpPosts.postType, "post"),
        eq(wpPosts.postStatus, "publish"),
        eq(wpPosts.postPassword, ""),
        lte(wpPosts.postDateGmt, new Date()),
        eq(postTranslationsTable.languageCode, effectiveLocale),
        inArray(wpTermRelationships.termTaxonomyId, taxIds)
      )
    )
    .groupBy(wpPosts.id, wpPosts.postDate)
    .orderBy(desc(wpPosts.postDate))
    .limit(limit)
    .offset(offset)

  if (!postIdsQuery.length) {
    return {
      category: {
        id: cat.termId.toString(),
        name: contentPlainText(cat.name),
        slug: cat.slug,
        description: contentPlainText(cat.description || ""),
        count: total,
        termTaxonomyId: cat.termTaxonomyId.toString(),
      },
      posts: [],
      total,
      totalPages,
      currentPage: safePage,
    }
  }

  const postIds = postIdsQuery.map((r) => r.id.toString())
  const [basePosts, termMap, imageMap, templateMap] = await Promise.all([
    db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        slug: wpPosts.postName,
        excerpt: wpPosts.postExcerpt,
        content: wpPosts.postContent,
        date: wpPosts.postDate,
        authorName: user.name,
        locale: postTranslationsTable.languageCode,
        direction: languagesTable.direction,
      })
      .from(wpPosts)
      .innerJoin(
        postTranslationsTable,
        eq(wpPosts.id, postTranslationsTable.postId)
      )
      .leftJoin(
        languagesTable,
        eq(postTranslationsTable.languageCode, languagesTable.code)
      )
      .leftJoin(user, eq(wpPosts.postAuthor, user.id))
      .where(
        inArray(
          wpPosts.id,
          postIdsQuery.map((r) => r.id)
        )
      )
      .orderBy(desc(wpPosts.postDate)),
    getTermData(postIds),
    getPostImageAssets(postIds),
    getPageTemplateData(postIds),
  ])

  const posts: ContentItem[] = basePosts.map((item) => {
    let contentImg = ""
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (match && match[1]) {
      contentImg = match[1]
    }

    const asset = imageMap.get(item.id.toString())
    const attachedImg = asset?.url
    const resolvedImg = attachedImg || contentImg || ""

    return {
      id: item.id.toString(),
      title: contentPlainText(item.title || ""),
      slug: item.slug || "untitled",
      excerpt: contentPlainText(item.excerpt || item.content).slice(0, 400),
      content: item.content || "",
      hasVideo: isVideoPost({
        content: item.content,
        hasVideo: termMap.get(item.id.toString())?.hasVideo,
      }),
      date: item.date,
      authorName: item.authorName || "",
      categories: termMap.get(item.id.toString())?.categories ?? [cat.name],
      tags: termMap.get(item.id.toString())?.tags ?? [],
      imageUrl: resolvedImg,
      imageWidth: asset?.width,
      imageHeight: asset?.height,
      imageSrcSet: asset?.srcSet,
      template: templateMap.get(item.id.toString()) || "default",
      locale: item.locale || undefined,
      direction: (item.direction as "ltr" | "rtl") || undefined,
    }
  })

  return {
    category: {
      id: cat.termId.toString(),
      name: contentPlainText(cat.name),
      slug: cat.slug,
      description: contentPlainText(cat.description || ""),
      count: total,
      termTaxonomyId: cat.termTaxonomyId.toString(),
    },
    posts,
    total,
    totalPages,
    currentPage: safePage,
  }
}

export const getPublishedPageById = cache(readPublishedPageById)

/** Query the full archive by taxonomy IDs; never load the archive into memory. */
export async function getRelatedPublishedPosts(
  postId: string,
  limit: number,
  strategy: "categories" | "tags" | "recent",
  locale?: string
) {
  if (!/^[1-9]\d{0,18}$/.test(postId)) return []
  const language = locale || (await getDefaultLanguage())?.code
  if (!language) return []
  const ids = await getRelatedPublishedPostIds(
    postId,
    limit,
    strategy,
    language
  )
  const posts = await getPublishedContent(
    "post",
    undefined,
    limit,
    language,
    ids
  )
  return ids
    .map((id) => posts.find((p) => p.id === id.toString()))
    .filter((p): p is NonNullable<typeof p> => !!p)
}
