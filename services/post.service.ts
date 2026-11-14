import "server-only"
import { verifyPostEditor, verifyAdmin } from "@/lib/authMIddleware"
import {
  createPostEditorSchema,
  updatePostEditorSchema,
  postIdSchema,
  postIdsSchema,
  postQuerySchema,
} from "@/db/schema/cms-post-editor"
import { renderPostMedia } from "@/lib/post-content-media"
import { contentPlainText } from "@/lib/content-text"
import { featuredVideoUrl } from "@/lib/featured-video"
import { getPostDateBounds } from "@/lib/post-date-filter"
import { postViewsExpression } from "./post-views.service"
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lt,
  ilike,
  inArray,
  ne,
  sql,
} from "drizzle-orm"
import { DB, db } from "@/db"
import {
  wpComments,
  wpPostmeta,
  wpPosts,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
  user,
} from "@/db/schema"
import {
  languagesTable,
  postTranslationsTable,
  termTranslationsTable,
} from "@/db/schema/cms-languages"
import {
  getPostLanguage,
  getDefaultLanguage,
  setPostLanguage,
  type LinkedPostTranslation,
} from "./language.service"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toBigInt(val: unknown): bigint {
  return postIdSchema.parse(val)
}

export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200)
}

export async function uniquePostSlug(
  title: string,
  excludeId?: bigint | string | number,
  database: DB = db
): Promise<string> {
  await verifyPostEditor()
  const base = toSlug(title) || `post-${Date.now()}`
  let slug = base
  let suffix = 2
  const currentId = excludeId !== undefined ? toBigInt(excludeId) : undefined

  while (true) {
    const existing = await database
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(
        and(
          eq(wpPosts.postName, slug),
          eq(wpPosts.postType, "post"),
          currentId ? ne(wpPosts.id, currentId) : undefined
        )
      )
      .limit(1)

    if (!existing.length) return slug
    const tail = `-${suffix++}`
    slug = `${base.slice(0, 200 - tail.length)}${tail}`
    if (suffix > 10000) throw new Error("slug_collision")
  }
}

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface PostTranslationLink {
  languageCode: string
  postId: string
  title: string
}

export interface PostItem {
  id: string
  title: string
  slug: string
  status: string
  date: string
  authorName: string
  categories: string[]
  categorySlugs: string[]
  tags: string[]
  viewCount?: number
  commentCount: string
  commentStatus: string
  pingStatus: string
  postPassword: string
  featuredVideoUrl?: string
  featuredImageId?: string
  isFeatured?: boolean
  languageCode?: string
  translationGroupId?: string
  translations?: PostTranslationLink[]
  seo?: PostSeoMeta
}

export interface PostSeoMeta {
  seoTitle?: string
  seoDescription?: string
  seoOgImage?: string
  seoNoindex?: boolean
  seoCanonical?: string
}

export interface GetPostsOptions {
  search?: string
  status?: string
  date?: string
  from?: string
  to?: string
  category?: string
  language?: string
  page?: number
  pageSize?: number
  orderBy?: "postModified" | "postDate" | "postTitle" | "viewCount"
  order?: "asc" | "desc"
}

export interface PostCounts {
  all: number
  publish: number
  draft: number
  pending: number
  trash: number
}

export interface CategoryOption {
  id: string
  slug: string
  name: string
  termTaxonomyId?: string
  languageCode?: string
  translationGroupId?: string
}

export interface TagOption {
  id: string
  slug: string
  name: string
}

export interface CreatePostInput {
  editorRestricted?: boolean
  title: string
  content?: string
  excerpt?: string
  status?: string
  commentStatus?: "open" | "closed"
  pingStatus?: "open" | "closed"
  postPassword?: string
  postParent?: string | number
  menuOrder?: number
  featuredVideoUrl?: string
  featuredImageId?: string
  isFeatured?: boolean
  categorySlugs?: string[]
  tags?: string[]
  languageCode?: string
  translationOf?: string | number | bigint
  authorId?: string
  seo?: PostSeoMeta
}

export class PostChangedError extends Error {}
export class PostPermissionError extends Error {}

export interface UpdatePostInput {
  /** Set by authenticated server actions, never copied from client fields. */
  editorRestricted?: boolean
  expectedModified?: string
  date?: string
  title?: string
  content?: string
  excerpt?: string
  slug?: string
  status?: string
  commentStatus?: "open" | "closed"
  pingStatus?: "open" | "closed"
  postPassword?: string
  postParent?: string | number
  menuOrder?: number
  featuredVideoUrl?: string
  featuredImageId?: string
  isFeatured?: boolean
  categorySlugs?: string[]
  tags?: string[]
  languageCode?: string
  translationOf?: string | number | bigint
  seo?: PostSeoMeta
}

// ---------------------------------------------------------------------------
// Term & Meta Helpers
// ---------------------------------------------------------------------------

async function syncFeaturedPostFlag(
  postId: bigint,
  isFeatured?: boolean,
  database: DB = db
) {
  if (isFeatured === undefined) return
  await database
    .delete(wpPostmeta)
    .where(
      and(eq(wpPostmeta.postId, postId), eq(wpPostmeta.metaKey, "_is_featured"))
    )

  if (isFeatured) {
    await database.insert(wpPostmeta).values({
      postId,
      metaKey: "_is_featured",
      metaValue: "1",
    })
  }
}

async function syncFeaturedImage(
  postId: bigint,
  featuredImageId?: string,
  database: DB = db
) {
  await database
    .delete(wpPostmeta)
    .where(
      and(
        eq(wpPostmeta.postId, postId),
        eq(wpPostmeta.metaKey, "_thumbnail_id")
      )
    )

  if (featuredImageId && /^\d+$/.test(featuredImageId.trim())) {
    await database.insert(wpPostmeta).values({
      postId,
      metaKey: "_thumbnail_id",
      metaValue: String(BigInt(featuredImageId.trim())),
    })
  }
}

export const SEO_META_KEYS = [
  "_seo_title",
  "_seo_description",
  "_seo_og_image",
  "_seo_noindex",
  "_seo_canonical",
] as const

async function syncPostSeoMeta(
  postId: bigint,
  seo?: PostSeoMeta,
  database: DB = db
) {
  if (!seo) return

  await database.delete(wpPostmeta).where(
    and(
      eq(wpPostmeta.postId, postId),
      inArray(
        wpPostmeta.metaKey,
        Object.keys(seo)
          .filter((key) => seo[key as keyof PostSeoMeta] !== undefined)
          .map(
            (key) =>
              ({
                seoTitle: "_seo_title",
                seoDescription: "_seo_description",
                seoOgImage: "_seo_og_image",
                seoNoindex: "_seo_noindex",
                seoCanonical: "_seo_canonical",
              })[key as keyof PostSeoMeta]
          )
      )
    )
  )

  const metaToInsert: { postId: bigint; metaKey: string; metaValue: string }[] =
    []

  if (seo.seoTitle !== undefined && seo.seoTitle.trim() !== "") {
    metaToInsert.push({
      postId,
      metaKey: "_seo_title",
      metaValue: seo.seoTitle.trim(),
    })
  }
  if (seo.seoDescription !== undefined && seo.seoDescription.trim() !== "") {
    metaToInsert.push({
      postId,
      metaKey: "_seo_description",
      metaValue: seo.seoDescription.trim(),
    })
  }
  if (seo.seoOgImage !== undefined && seo.seoOgImage.trim() !== "") {
    metaToInsert.push({
      postId,
      metaKey: "_seo_og_image",
      metaValue: seo.seoOgImage.trim(),
    })
  }
  if (seo.seoNoindex !== undefined) {
    metaToInsert.push({
      postId,
      metaKey: "_seo_noindex",
      metaValue: seo.seoNoindex ? "1" : "0",
    })
  }
  if (seo.seoCanonical !== undefined && seo.seoCanonical.trim() !== "") {
    metaToInsert.push({
      postId,
      metaKey: "_seo_canonical",
      metaValue: seo.seoCanonical.trim(),
    })
  }

  if (metaToInsert.length > 0) {
    await database.insert(wpPostmeta).values(metaToInsert)
  }
}

async function syncPostTerms(
  postId: bigint,
  categorySlugs: string[] | undefined,
  tags: string[] | undefined,
  database: DB = db
) {
  const kinds = [
    ...(categorySlugs !== undefined ? ["category"] : []),
    ...(tags !== undefined ? ["post_tag"] : []),
  ]
  const previous = await database
    .select({ id: wpTermTaxonomy.termTaxonomyId })
    .from(wpTermRelationships)
    .innerJoin(
      wpTermTaxonomy,
      eq(wpTermTaxonomy.termTaxonomyId, wpTermRelationships.termTaxonomyId)
    )
    .where(
      and(
        eq(wpTermRelationships.objectId, postId),
        inArray(wpTermTaxonomy.taxonomy, kinds)
      )
    )
  if (previous.length)
    await database.delete(wpTermRelationships).where(
      and(
        eq(wpTermRelationships.objectId, postId),
        inArray(
          wpTermRelationships.termTaxonomyId,
          previous.map((item) => item.id)
        )
      )
    )

  const taxonomyIds: bigint[] = []

  if (categorySlugs?.length) {
    const categories = await database
      .select({ taxonomyId: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(
        and(
          eq(wpTermTaxonomy.taxonomy, "category"),
          inArray(wpTerms.slug, categorySlugs)
        )
      )
    if (categories.length !== categorySlugs.length)
      throw new Error("invalid_categories")
    taxonomyIds.push(...categories.map((c) => c.taxonomyId))
  }

  for (const tagName of tags || []) {
    const cleanTag = tagName.trim()
    if (!cleanTag) continue
    const slug = toSlug(cleanTag)
    const existing = await database
      .select({ termId: wpTerms.termId })
      .from(wpTerms)
      .where(eq(wpTerms.slug, slug))
      .limit(1)

    const termId =
      existing[0]?.termId ??
      (
        await database
          .insert(wpTerms)
          .values({ name: cleanTag, slug })
          .returning({ termId: wpTerms.termId })
      )[0].termId

    const taxonomy = await database
      .select({ id: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .where(
        and(
          eq(wpTermTaxonomy.termId, termId),
          eq(wpTermTaxonomy.taxonomy, "post_tag")
        )
      )
      .limit(1)

    const taxonomyId =
      taxonomy[0]?.id ??
      (
        await database
          .insert(wpTermTaxonomy)
          .values({ termId, taxonomy: "post_tag" })
          .returning({ id: wpTermTaxonomy.termTaxonomyId })
      )[0].id

    taxonomyIds.push(taxonomyId)
  }

  if (taxonomyIds.length) {
    await database.insert(wpTermRelationships).values(
      [...new Set(taxonomyIds)].map((termTaxonomyId) => ({
        objectId: postId,
        termTaxonomyId,
      }))
    )
  }
  await refreshPostTaxonomyCounts(
    [...previous.map((item) => item.id), ...taxonomyIds],
    database
  )
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

export async function getPosts(
  options: GetPostsOptions = {},
  database: DB = db
): Promise<{
  posts: PostItem[]
  totalItems: number
  totalPages: number
  currentPage: number
}> {
  const session = await verifyPostEditor()
  const {
    search,
    status,
    date,
    from,
    to,
    category,
    language,
    page = 1,
    pageSize: requestedPageSize = 20,
    orderBy = "postModified",
    order = "desc",
  } = postQuerySchema.parse(options)

  if (session.user.role === "editor" && status === "trash")
    throw new PostPermissionError()
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.max(1, Math.min(100, Math.trunc(requestedPageSize)))
    : 20
  let currentPage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1
  const conditions = [eq(wpPosts.postType, "post")]

  if (status && status !== "all") {
    conditions.push(eq(wpPosts.postStatus, status))
  } else if (!status || status === "all") {
    conditions.push(ne(wpPosts.postStatus, "trash"))
  }

  const bounds = getPostDateBounds({ date: date || "all", from, to })
  if (!bounds.valid) conditions.push(sql`false`)
  else {
    if (bounds.start) conditions.push(gte(wpPosts.postDate, bounds.start))
    if (bounds.end) conditions.push(lt(wpPosts.postDate, bounds.end))
  }

  if (search && search.trim()) {
    conditions.push(ilike(wpPosts.postTitle, `%${search.trim()}%`))
  }

  // Filter by category
  if (category && category !== "all") {
    const catRows = await database
      .select({ taxonomyId: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(
        and(eq(wpTerms.slug, category), eq(wpTermTaxonomy.taxonomy, "category"))
      )
      .limit(1)

    if (catRows[0]) {
      const relRows = await database
        .select({ objectId: wpTermRelationships.objectId })
        .from(wpTermRelationships)
        .where(eq(wpTermRelationships.termTaxonomyId, catRows[0].taxonomyId))

      const postIds = relRows.map((r) => r.objectId)
      if (postIds.length) {
        conditions.push(inArray(wpPosts.id, postIds))
      } else {
        conditions.push(eq(wpPosts.id, BigInt(-1)))
      }
    } else {
      conditions.push(eq(wpPosts.id, BigInt(-1)))
    }
  }

  // Filter by language
  if (language && language !== "all") {
    const langPostRows = await database
      .select({ postId: postTranslationsTable.postId })
      .from(postTranslationsTable)
      .where(eq(postTranslationsTable.languageCode, language))

    const langPostIds = langPostRows.map((r) => r.postId)
    if (langPostIds.length) {
      conditions.push(inArray(wpPosts.id, langPostIds))
    } else {
      conditions.push(eq(wpPosts.id, BigInt(-1)))
    }
  }

  const whereClause = and(...conditions)

  const [totalRes] = await database
    .select({ total: count() })
    .from(wpPosts)
    .where(whereClause)

  const totalItems = Number(totalRes?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  currentPage = Math.min(currentPage, totalPages)

  const sortColumn =
    orderBy === "viewCount"
      ? postViewsExpression
      : orderBy === "postDate"
        ? wpPosts.postDate
        : orderBy === "postTitle"
          ? wpPosts.postTitle
          : wpPosts.postModified

  const sortFn = order === "asc" ? asc : desc

  const rows = await database
    .select({
      id: wpPosts.id,
      viewCount: postViewsExpression,
      title: wpPosts.postTitle,
      slug: wpPosts.postName,
      status: wpPosts.postStatus,
      date: wpPosts.postDate,
      authorName: user.name,
      commentStatus: wpPosts.commentStatus,
      pingStatus: wpPosts.pingStatus,
      postPassword: wpPosts.postPassword,
    })
    .from(wpPosts)
    .leftJoin(user, eq(wpPosts.postAuthor, user.id))
    .where(whereClause)
    .orderBy(sortFn(sortColumn), desc(wpPosts.id))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize)

  if (!rows.length) {
    return { posts: [], totalItems, totalPages, currentPage }
  }

  const postIds = rows.map((r) => r.id)

  // Fetch comments, terms, featured images, and language info in parallel
  const [commentRows, termRows, metaRows, postTransRows] = await Promise.all([
    database
      .select({ postId: wpComments.commentPostId, count: count() })
      .from(wpComments)
      .where(inArray(wpComments.commentPostId, postIds))
      .groupBy(wpComments.commentPostId),
    database
      .select({
        objectId: wpTermRelationships.objectId,
        taxonomy: wpTermTaxonomy.taxonomy,
        name: wpTerms.name,
        slug: wpTerms.slug,
      })
      .from(wpTermRelationships)
      .innerJoin(
        wpTermTaxonomy,
        eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
      )
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(inArray(wpTermRelationships.objectId, postIds)),
    database
      .select({
        postId: wpPostmeta.postId,
        metaKey: wpPostmeta.metaKey,
        metaValue: wpPostmeta.metaValue,
      })
      .from(wpPostmeta)
      .where(
        and(
          inArray(wpPostmeta.postId, postIds),
          inArray(wpPostmeta.metaKey, ["_thumbnail_id", "_is_featured"])
        )
      ),
    database
      .select({
        postId: postTranslationsTable.postId,
        languageCode: postTranslationsTable.languageCode,
        translationGroupId: postTranslationsTable.translationGroupId,
      })
      .from(postTranslationsTable)
      .where(inArray(postTranslationsTable.postId, postIds)),
  ])

  // Fetch sibling translations for translation groups
  const groupIds = Array.from(
    new Set(postTransRows.map((t) => t.translationGroupId).filter(Boolean))
  )
  let siblingTranslations: {
    groupId: string
    postId: bigint
    languageCode: string
    title: string
  }[] = []

  if (groupIds.length) {
    siblingTranslations = await database
      .select({
        groupId: postTranslationsTable.translationGroupId,
        postId: postTranslationsTable.postId,
        languageCode: postTranslationsTable.languageCode,
        title: wpPosts.postTitle,
      })
      .from(postTranslationsTable)
      .innerJoin(wpPosts, eq(postTranslationsTable.postId, wpPosts.id))
      .where(inArray(postTranslationsTable.translationGroupId, groupIds))
  }

  const posts: PostItem[] = rows.map((post) => {
    const comments = commentRows.find((c) => c.postId === post.id)
    const terms = termRows.filter((t) => t.objectId === post.id)
    const catTerms = terms.filter((t) => t.taxonomy === "category")
    const tagTerms = terms.filter((t) => t.taxonomy === "post_tag")
    const thumb = metaRows.find(
      (m) => m.postId === post.id && m.metaKey === "_thumbnail_id"
    )
    const featuredRow = metaRows.find(
      (m) => m.postId === post.id && m.metaKey === "_is_featured"
    )
    const transInfo = postTransRows.find((t) => t.postId === post.id)

    let translations: PostTranslationLink[] | undefined
    if (transInfo?.translationGroupId) {
      translations = siblingTranslations
        .filter(
          (st) =>
            st.groupId === transInfo.translationGroupId && st.postId !== post.id
        )
        .map((st) => ({
          languageCode: st.languageCode,
          postId: st.postId.toString(),
          title: st.title,
        }))
    }

    return {
      id: post.id.toString(),
      viewCount: Number(post.viewCount || 0),
      title: post.title,
      slug: post.slug,
      status: post.status,
      date: post.date.toISOString(),
      authorName: post.authorName ?? "admin",
      categories: catTerms.map((c) => c.name),
      categorySlugs: catTerms.map((c) => c.slug),
      tags: tagTerms.map((t) => t.name),
      commentCount: String(comments?.count ?? 0),
      commentStatus: post.commentStatus,
      pingStatus: post.pingStatus,
      postPassword: post.postPassword,
      featuredImageId: thumb?.metaValue ?? undefined,
      isFeatured: featuredRow?.metaValue === "1",
      languageCode: transInfo?.languageCode,
      translationGroupId: transInfo?.translationGroupId,
      translations,
    }
  })

  return { posts, totalItems, totalPages, currentPage }
}

export async function getPostCounts(
  options: { language?: string } = {},
  database: DB = db
): Promise<PostCounts> {
  await verifyPostEditor()
  const { language } = postQuerySchema.parse(options)

  let langPostIds: bigint[] | undefined
  if (language && language !== "all") {
    const langRows = await database
      .select({ postId: postTranslationsTable.postId })
      .from(postTranslationsTable)
      .where(eq(postTranslationsTable.languageCode, language))
    langPostIds = langRows.map((r) => r.postId)
  }

  const buildCount = async (status?: string) => {
    const conditions = [eq(wpPosts.postType, "post")]
    if (status) {
      conditions.push(eq(wpPosts.postStatus, status))
    } else {
      conditions.push(ne(wpPosts.postStatus, "trash"))
    }
    if (langPostIds !== undefined) {
      if (langPostIds.length) {
        conditions.push(inArray(wpPosts.id, langPostIds))
      } else {
        return 0
      }
    }
    const [res] = await database
      .select({ c: count() })
      .from(wpPosts)
      .where(and(...conditions))
    return Number(res?.c ?? 0)
  }

  const [all, publish, draft, pending, trash] = await Promise.all([
    buildCount(undefined),
    buildCount("publish"),
    buildCount("draft"),
    buildCount("pending"),
    buildCount("trash"),
  ])

  return { all, publish, draft, pending, trash }
}

export async function getPostById(
  id: bigint | string | number,
  database: DB = db
): Promise<{
  post: {
    id: string
    modifiedAt: string
    date: string
    title: string
    content: string
    excerpt: string
    slug: string
    status: string
    commentStatus: string
    pingStatus: string
    postPassword: string
    featuredVideoUrl: string
    featuredImageId: string
    isFeatured: boolean
    categorySlugs: string[]
    tags: string[]
    languageCode?: string
    translationGroupId?: string
    seo: PostSeoMeta
  }
  translations: LinkedPostTranslation[]
} | null> {
  const session = await verifyPostEditor()
  const parsedId = postIdSchema.safeParse(id)
  if (!parsedId.success) return null
  const postId = parsedId.data

  const [postRows, metaRows, termRows, langInfo, translations] =
    await Promise.all([
      database
        .select({
          id: wpPosts.id,
          title: wpPosts.postTitle,
          modifiedAt: wpPosts.postModifiedGmt,
          date: wpPosts.postDate,
          content: wpPosts.postContent,
          excerpt: wpPosts.postExcerpt,
          slug: wpPosts.postName,
          status: wpPosts.postStatus,
          commentStatus: wpPosts.commentStatus,
          pingStatus: wpPosts.pingStatus,
          postPassword: wpPosts.postPassword,
        })
        .from(wpPosts)
        .where(and(eq(wpPosts.id, postId), eq(wpPosts.postType, "post")))
        .limit(1),
      database
        .select({
          metaKey: wpPostmeta.metaKey,
          metaValue: wpPostmeta.metaValue,
        })
        .from(wpPostmeta)
        .where(
          and(
            eq(wpPostmeta.postId, postId),
            inArray(wpPostmeta.metaKey, [
              "_featured_video_url",
              "_thumbnail_id",
              "_is_featured",
              ...SEO_META_KEYS,
            ])
          )
        ),
      database
        .select({
          taxonomy: wpTermTaxonomy.taxonomy,
          name: wpTerms.name,
          slug: wpTerms.slug,
        })
        .from(wpTermRelationships)
        .innerJoin(
          wpTermTaxonomy,
          eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
        )
        .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
        .where(eq(wpTermRelationships.objectId, postId)),
      getPostLanguage(postId, database),
      getAdminPostTranslations(postId, database),
    ])

  if (!postRows.length) return null
  const p = postRows[0]
  if (session.user.role === "editor" && p.status === "trash") return null
  const thumb = metaRows.find((m) => m.metaKey === "_thumbnail_id")
  const isFeatured =
    metaRows.find((m) => m.metaKey === "_is_featured")?.metaValue === "1"
  const seoTitle =
    metaRows.find((m) => m.metaKey === "_seo_title")?.metaValue ?? undefined
  const seoDescription =
    metaRows.find((m) => m.metaKey === "_seo_description")?.metaValue ??
    undefined
  const seoOgImage =
    metaRows.find((m) => m.metaKey === "_seo_og_image")?.metaValue ?? undefined
  const seoNoindex =
    metaRows.find((m) => m.metaKey === "_seo_noindex")?.metaValue === "1"
  const seoCanonical =
    metaRows.find((m) => m.metaKey === "_seo_canonical")?.metaValue ?? undefined

  const catSlugs = termRows
    .filter((t) => t.taxonomy === "category")
    .map((t) => t.slug)
  const tagNames = termRows
    .filter((t) => t.taxonomy === "post_tag")
    .map((t) => t.name)

  return {
    post: {
      id: p.id.toString(),
      modifiedAt: p.modifiedAt?.toISOString() || "",
      date: p.date.toISOString(),
      title: p.title,
      content: renderPostMedia(p.content),
      excerpt: p.excerpt,
      slug: p.slug,
      status: p.status,
      commentStatus: p.commentStatus,
      pingStatus: p.pingStatus,
      postPassword: p.postPassword,
      featuredVideoUrl:
        featuredVideoUrl(
          metaRows.find((m) => m.metaKey === "_featured_video_url")?.metaValue
        ) || "",
      featuredImageId: thumb?.metaValue ?? "",
      isFeatured,
      categorySlugs: catSlugs,
      tags: tagNames,
      languageCode: langInfo?.languageCode,
      translationGroupId: langInfo?.translationGroupId,
      seo: {
        seoTitle,
        seoDescription,
        seoOgImage,
        seoNoindex,
        seoCanonical,
      },
    },
    translations,
  }
}

export async function getAllCategoriesOptions(
  language?: string,
  database: DB = db
): Promise<CategoryOption[]> {
  await verifyPostEditor()
  const conditions = [eq(wpTermTaxonomy.taxonomy, "category")]

  if (language && language !== "all") {
    const matching = await database
      .select({ termTaxonomyId: termTranslationsTable.termTaxonomyId })
      .from(termTranslationsTable)
      .where(eq(termTranslationsTable.languageCode, language))
    const taxIds = matching.map((m) => m.termTaxonomyId)
    if (taxIds.length > 0) {
      conditions.push(inArray(wpTermTaxonomy.termTaxonomyId, taxIds))
    } else {
      conditions.push(eq(wpTermTaxonomy.termTaxonomyId, BigInt(-1)))
    }
  }

  const rows = await database
    .select({
      id: wpTerms.termId,
      slug: wpTerms.slug,
      name: wpTerms.name,
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
      languageCode: termTranslationsTable.languageCode,
      translationGroupId: termTranslationsTable.translationGroupId,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .leftJoin(
      termTranslationsTable,
      eq(wpTermTaxonomy.termTaxonomyId, termTranslationsTable.termTaxonomyId)
    )
    .where(and(...conditions))
    .orderBy(asc(wpTerms.name))

  return rows.map((r) => ({
    id: r.id.toString(),
    slug: r.slug,
    name: r.name,
    termTaxonomyId: r.termTaxonomyId.toString(),
    languageCode: r.languageCode ?? "en",
    translationGroupId: r.translationGroupId ?? undefined,
  }))
}

export async function getAllTagOptions(
  database: DB = db
): Promise<TagOption[]> {
  await verifyPostEditor()
  const rows = await database
    .select({
      id: wpTerms.termId,
      slug: wpTerms.slug,
      name: wpTerms.name,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(eq(wpTermTaxonomy.taxonomy, "post_tag"))
    .orderBy(asc(wpTerms.name))

  return rows.map((r) => ({
    id: r.id.toString(),
    slug: r.slug,
    name: r.name,
  }))
}

export async function createPost(
  input: CreatePostInput,
  database: DB = db
): Promise<string> {
  const session = await verifyPostEditor()
  const parsed = createPostEditorSchema.parse(input)
  if (session.user.role === "editor" && parsed.status === "trash")
    throw new PostPermissionError()
  return database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:posts'))`
    )
    await validatePostLinks(parsed, tx)
    const locale = parsed.languageCode || (await getDefaultLanguage(tx))?.code
    if (!locale) throw new Error("invalid_language")
    return createPostRecord(
      {
        ...parsed,
        languageCode: locale,
        authorId: session.user.id,
        editorRestricted: session.user.role === "editor",
      },
      tx
    )
  })
}

async function createPostRecord(
  input: CreatePostInput,
  database: DB = db
): Promise<string> {
  if (input.editorRestricted && input.status === "trash")
    throw new PostPermissionError()
  const {
    title,
    content: rawContent = "",
    excerpt = "",
    status = "draft",
    commentStatus = "open",
    pingStatus = "open",
    postPassword = "",
    postParent = "0",
    menuOrder = 0,
    featuredImageId,
    categorySlugs = [],
    tags = [],
    languageCode = "en",
    translationOf,
    authorId,
  } = input

  const content = renderPostMedia(rawContent)
  const slug = await uniquePostSlug(title, undefined, database)
  const now = new Date()
  const generatedExcerpt =
    excerpt ||
    content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200) ||
    ""

  const inserted = await database
    .insert(wpPosts)
    .values({
      postAuthor: authorId ?? null,
      postDate: now,
      postDateGmt: now,
      postContent: content,
      postTitle: title,
      postExcerpt: contentPlainText(generatedExcerpt),
      postStatus: status,
      commentStatus,
      pingStatus,
      postPassword,
      postName: slug,
      toPing: "",
      pinged: "",
      postModified: now,
      postModifiedGmt: now,
      postContentFiltered: "",
      postParent:
        postParent === "0" || postParent === 0
          ? BigInt(0)
          : toBigInt(postParent),
      guid: `/posts/${slug}`,
      menuOrder,
      postType: "post",
      postMimeType: "",
      commentCount: BigInt(0),
    })
    .returning({ id: wpPosts.id })

  const newId = inserted[0].id

  await syncFeaturedImage(newId, featuredImageId, database)
  await syncFeaturedPostFlag(newId, input.isFeatured, database)
  await syncFeaturedVideo(newId, input.featuredVideoUrl, database)
  await syncPostTerms(newId, categorySlugs, tags, database)

  if (input.seo) {
    await syncPostSeoMeta(newId, input.seo, database)
  }

  const sourcePostId = translationOf ? toBigInt(translationOf) : undefined
  await setPostLanguage(newId, languageCode, sourcePostId, database)

  return newId.toString()
}

export async function updatePost(
  id: bigint | string | number,
  input: UpdatePostInput,
  database: DB = db
): Promise<void> {
  const session = await verifyPostEditor()
  const postId = postIdSchema.parse(id)
  const parsed = updatePostEditorSchema.parse(input)
  if (session.user.role === "editor" && parsed.status === "trash")
    throw new PostPermissionError()
  return database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:posts'))`
    )
    await updatePostRecord(
      postId,
      { ...parsed, editorRestricted: session.user.role === "editor" },
      tx
    )
  })
}

async function updatePostRecord(
  id: bigint | string | number,
  input: UpdatePostInput,
  database: DB = db
): Promise<void> {
  const postId = toBigInt(id)
  if (postId <= BigInt(0)) throw new Error("A valid post ID is required")

  const existing = await database
    .select({
      id: wpPosts.id,
      postTitle: wpPosts.postTitle,
      status: wpPosts.postStatus,
      slug: wpPosts.postName,
      modified: wpPosts.postModifiedGmt,
    })
    .from(wpPosts)
    .where(and(eq(wpPosts.id, postId), eq(wpPosts.postType, "post")))
    .limit(1)
    .for("update")

  if (!existing.length) throw new Error("Post not found")
  if (
    input.editorRestricted &&
    (existing[0].status === "trash" || input.status === "trash")
  )
    throw new PostPermissionError()
  if (
    input.expectedModified &&
    existing[0].modified.toISOString() !== input.expectedModified
  )
    throw new PostChangedError("post_changed")

  await validatePostLinks(input, database)
  const updates: Partial<typeof wpPosts.$inferInsert> = {
    postModified: new Date(),
    postModifiedGmt: new Date(),
  }

  if (input.title !== undefined) updates.postTitle = input.title
  if (input.slug !== undefined) {
    const slug = input.slug?.trim()
      ? await uniquePostSlug(input.slug, postId, database)
      : await uniquePostSlug(
          input.title || existing[0].postTitle,
          postId,
          database
        )
    updates.postName = slug
    updates.guid = `/posts/${slug}`
  }

  if (input.content !== undefined)
    updates.postContent = renderPostMedia(input.content)
  if (input.excerpt !== undefined) {
    updates.postExcerpt = contentPlainText(input.excerpt)
  } else if (input.content !== undefined && updates.postContent) {
    updates.postExcerpt = updates.postContent
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200)
  }

  if (input.date) {
    updates.postDate = new Date(input.date)
    updates.postDateGmt = new Date(input.date)
  }
  if (input.status !== undefined) updates.postStatus = input.status
  if (input.commentStatus !== undefined)
    updates.commentStatus = input.commentStatus
  if (input.pingStatus !== undefined) updates.pingStatus = input.pingStatus
  if (input.postPassword !== undefined)
    updates.postPassword = input.postPassword
  if (input.postParent !== undefined)
    updates.postParent =
      input.postParent === "0" || input.postParent === 0
        ? BigInt(0)
        : toBigInt(input.postParent)
  if (input.menuOrder !== undefined) updates.menuOrder = input.menuOrder

  await database
    .update(wpPosts)
    .set(updates)
    .where(and(eq(wpPosts.id, postId), eq(wpPosts.postType, "post")))

  if (input.featuredImageId !== undefined) {
    await syncFeaturedImage(postId, input.featuredImageId, database)
  }
  await syncFeaturedVideo(postId, input.featuredVideoUrl, database)
  if (input.isFeatured !== undefined) {
    await syncFeaturedPostFlag(postId, input.isFeatured, database)
  }

  if (input.categorySlugs !== undefined || input.tags !== undefined) {
    await syncPostTerms(postId, input.categorySlugs, input.tags, database)
  }

  if (input.seo !== undefined) {
    await syncPostSeoMeta(postId, input.seo, database)
  }

  if (
    input.status !== undefined &&
    input.categorySlugs === undefined &&
    input.tags === undefined
  ) {
    const assigned = await database
      .select({ id: wpTermRelationships.termTaxonomyId })
      .from(wpTermRelationships)
      .where(eq(wpTermRelationships.objectId, postId))
    await refreshPostTaxonomyCounts(
      assigned.map((item) => item.id),
      database
    )
  }
  if (input.languageCode) {
    const sourcePostId = input.translationOf
      ? toBigInt(input.translationOf)
      : undefined
    await setPostLanguage(postId, input.languageCode, sourcePostId, database)
  }
}

async function changePostLifecycle(
  raw: (bigint | string | number)[],
  mode: "trash" | "restore" | "delete",
  database: DB
) {
  await verifyAdmin()
  const ids = postIdsSchema.parse(raw)
  await database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:posts'))`
    )
    const rows = await tx
      .select({ id: wpPosts.id, status: wpPosts.postStatus })
      .from(wpPosts)
      .where(and(inArray(wpPosts.id, ids), eq(wpPosts.postType, "post")))
      .for("update")
    if (rows.length !== ids.length) throw new Error("missing_posts")
    if (mode !== "trash" && rows.some((row) => row.status !== "trash"))
      throw new Error("invalid_status")
    const assigned = await tx
      .select({ id: wpTermRelationships.termTaxonomyId })
      .from(wpTermRelationships)
      .where(inArray(wpTermRelationships.objectId, ids))
    if (mode !== "delete") {
      await tx
        .update(wpPosts)
        .set({
          postStatus: mode === "trash" ? "trash" : "draft",
          postModified: new Date(),
          postModifiedGmt: new Date(),
        })
        .where(and(inArray(wpPosts.id, ids), eq(wpPosts.postType, "post")))
    } else {
      await tx.delete(wpPostmeta).where(inArray(wpPostmeta.postId, ids))
      await tx
        .delete(wpTermRelationships)
        .where(inArray(wpTermRelationships.objectId, ids))
      await tx
        .delete(postTranslationsTable)
        .where(inArray(postTranslationsTable.postId, ids))
      await tx.delete(wpComments).where(inArray(wpComments.commentPostId, ids))
      await tx
        .delete(wpPosts)
        .where(and(inArray(wpPosts.id, ids), eq(wpPosts.postType, "post")))
    }
    await refreshPostTaxonomyCounts(
      assigned.map((item) => item.id),
      tx
    )
  })
}
export async function trashPosts(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  return changePostLifecycle(ids, "trash", database)
}
export async function restorePosts(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  return changePostLifecycle(ids, "restore", database)
}
export async function deletePosts(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  return changePostLifecycle(ids, "delete", database)
}

export async function getPostMonths(database: DB = db): Promise<string[]> {
  await verifyPostEditor()
  const month = sql<string>`to_char(${wpPosts.postDate},'YYYY-MM')`
  const rows = await database
    .select({ month })
    .from(wpPosts)
    .where(
      and(eq(wpPosts.postType, "post"), ne(wpPosts.postStatus, "auto-draft"))
    )
    .groupBy(month)
    .orderBy(desc(month))
  return rows.map((row) => row.month)
}

async function validatePostLinks(input: UpdatePostInput, database: DB) {
  if (input.featuredImageId) {
    const [image] = await database
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(
        and(
          eq(wpPosts.id, postIdSchema.parse(input.featuredImageId)),
          eq(wpPosts.postType, "attachment"),
          ilike(wpPosts.postMimeType, "image/%")
        )
      )
      .limit(1)
    if (!image) throw new Error("invalid_image")
  }
  if (input.postParent && String(input.postParent) !== "0")
    throw new Error("invalid_parent")
  if (input.translationOf) {
    const [source] = await database
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(
        and(
          eq(wpPosts.id, postIdSchema.parse(input.translationOf)),
          eq(wpPosts.postType, "post"),
          ne(wpPosts.postStatus, "trash")
        )
      )
      .limit(1)
    if (!source) throw new Error("invalid_translation")
  }
}
async function syncFeaturedVideo(
  postId: bigint,
  url: string | undefined,
  database: DB
) {
  if (url === undefined) return
  await database
    .delete(wpPostmeta)
    .where(
      and(
        eq(wpPostmeta.postId, postId),
        eq(wpPostmeta.metaKey, "_featured_video_url")
      )
    )
  if (url)
    await database
      .insert(wpPostmeta)
      .values({ postId, metaKey: "_featured_video_url", metaValue: url })
}
async function getAdminPostTranslations(
  id: bigint,
  database: DB
): Promise<LinkedPostTranslation[]> {
  const language = await getPostLanguage(id, database)
  if (!language) return []
  return database
    .select({
      postId: wpPosts.id,
      slug: wpPosts.postName,
      title: wpPosts.postTitle,
      languageCode: languagesTable.code,
      languageName: languagesTable.name,
      nativeName: languagesTable.nativeName,
      direction: languagesTable.direction,
      isDefault: languagesTable.isDefault,
    })
    .from(postTranslationsTable)
    .innerJoin(wpPosts, eq(wpPosts.id, postTranslationsTable.postId))
    .innerJoin(
      languagesTable,
      eq(languagesTable.code, postTranslationsTable.languageCode)
    )
    .where(
      and(
        eq(
          postTranslationsTable.translationGroupId,
          language.translationGroupId
        ),
        eq(wpPosts.postType, "post"),
        ne(wpPosts.postStatus, "trash"),
        eq(languagesTable.isActive, true)
      )
    )
}

async function refreshPostTaxonomyCounts(ids: bigint[], database: DB) {
  if (!ids.length) return
  await database
    .update(wpTermTaxonomy)
    .set({
      count: sql`(select count(distinct rel.object_id)::bigint from wp_term_relationships rel join wp_posts p on p."ID"=rel.object_id where rel.term_taxonomy_id=${wpTermTaxonomy.termTaxonomyId} and p.post_type='post' and p.post_status='publish')`,
    })
    .where(
      and(
        inArray(wpTermTaxonomy.termTaxonomyId, [...new Set(ids)]),
        inArray(wpTermTaxonomy.taxonomy, ["category", "post_tag"])
      )
    )
}
