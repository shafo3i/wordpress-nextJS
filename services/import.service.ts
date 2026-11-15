import { checkCmsRateLimit } from "@/lib/rate-limit";
import "server-only"
import { randomUUID } from "node:crypto"
import { db } from "@/db"
import {
  wpPosts,
  wpPostmeta,
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  wpComments,
} from "@/db/schema"
import {
  languagesTable,
  postTranslationsTable,
  termTranslationsTable,
} from "@/db/schema/cms-languages"
import {
  toolsArchiveSchema,
  PORTABLE_META_KEYS,
  type ToolsArchive,
} from "@/db/schema/cms-tools-archive"
import { importTextSchema } from "@/db/schema/cms-tools"
import { verifyAdmin } from "@/lib/authMIddleware"
import { safeMediaUrl } from "@/lib/post-media"
import { renderPostMedia } from "@/lib/post-content-media"
import { contentPlainText } from "@/lib/content-text"
import { featuredVideoUrl } from "@/lib/featured-video"
import { mediaPathParts } from "@/lib/media-files"
import { eq, and, sql } from "drizzle-orm"
import { XMLParser, XMLValidator } from "fast-xml-parser"
export interface ImportResult {
  success: boolean
  postsImported: number
  pagesImported: number
  categoriesImported: number
  tagsImported: number
  commentsImported: number
  skippedCount: number
  message?: string
}
const array = <T>(value: unknown): T[] =>
  value === undefined ? [] : ((Array.isArray(value) ? value : [value]) as T[])
const text = (value: unknown): string =>
  typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : value && typeof value === "object"
        ? text(
            (value as Record<string, unknown>).__cdata ??
              (value as Record<string, unknown>)["#text"]
          )
        : ""
const slug = (value: string) =>
  Array.from(
    value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .replace(/^-+|-+$/g, "")
  )
    .slice(0, 200)
    .join("")
function validateText(value: string) {
  importTextSchema.parse(value)
  if (Buffer.byteLength(value) > 20 * 1024 * 1024)
    throw new Error("import_too_large")
}
export async function importJsonArchive(
  content: string,
  _fallbackAuthorId: string
): Promise<ImportResult> {
  const session = await verifyAdmin()
  await checkCmsRateLimit(session.user.id, "import");
  void _fallbackAuthorId
  validateText(content)
  return importArchive(
    toolsArchiveSchema.parse(JSON.parse(content)),
    session.user.id
  )
}
export async function importWxrXml(
  content: string,
  _fallbackAuthorId: string
): Promise<ImportResult> {
  const session = await verifyAdmin()
  await checkCmsRateLimit(session.user.id, "import");
  void _fallbackAuthorId
  validateText(content)
  if (
    /<!DOCTYPE|<!ENTITY/i.test(content) ||
    XMLValidator.validate(content) !== true
  )
    throw new Error("invalid_wxr")
  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    cdataPropName: "__cdata",
    parseTagValue: false,
    processEntities: false,
    maxNestedTags: 50,
  }).parse(content)
  const channel = parsed?.rss?.channel
  if (!channel || !text(channel["wp:wxr_version"]).startsWith("1."))
    throw new Error("invalid_wxr")
  const data: Record<string, unknown[]> = {
    posts: [],
    terms: [],
    taxonomies: [],
    relationships: [],
    metadata: [],
    comments: [],
  }
  const termIds = new Map<string, string>()
  let nextTerm = 1
  function term(
    taxonomy: string,
    name: string,
    nicename: string,
    description = ""
  ) {
    const normalized = nicename || slug(name)
    const key = `${taxonomy}:${normalized}`
    if (!termIds.has(key)) {
      const id = String(nextTerm++)
      termIds.set(key, id)
      data.terms.push({ termId: id, name, slug: normalized })
      data.taxonomies.push({
        termTaxonomyId: id,
        termId: id,
        taxonomy,
        description,
      })
    }
    return termIds.get(key)!
  }
  for (const item of array<Record<string, unknown>>(channel["wp:category"]))
    term(
      "category",
      text(item["wp:cat_name"]),
      text(item["wp:category_nicename"]),
      text(item["wp:category_description"])
    )
  for (const item of array<Record<string, unknown>>(channel["wp:tag"]))
    term(
      "post_tag",
      text(item["wp:tag_name"]),
      text(item["wp:tag_slug"]),
      text(item["wp:tag_description"])
    )
  for (const category of array<Record<string, unknown>>(
    channel["wp:category"]
  )) {
    const id = termIds.get(
      `category:${text(category["wp:category_nicename"]) || slug(text(category["wp:cat_name"]))}`
    )
    const parent = termIds.get(
      `category:${text(category["wp:category_parent"])}`
    )
    if (id && parent)
      data.taxonomies = data.taxonomies.map((value) => {
        const tax = value as { termId: string }
        return tax.termId === id ? { ...tax, parent } : tax
      })
  }
  const wxrDate = (value: string) =>
    !value || value.startsWith("0000")
      ? undefined
      : new Date(
          value.replace(" ", "T") +
            (/Z$|[+-]\d{2}:\d{2}$/.test(value) ? "" : "Z")
        )
  let nextPost = 1,
    nextComment = 1
  for (const item of array<Record<string, unknown>>(channel.item)) {
    const type = text(item["wp:post_type"])
    if (!["post", "page", "attachment"].includes(type)) continue
    const id = text(item["wp:post_id"]) || String(nextPost++)
    const date = text(item["wp:post_date"]),
      gmt = text(item["wp:post_date_gmt"])
    const mime = text(item["wp:post_mime_type"])
    data.posts.push({
      id,
      postTitle: text(item.title),
      postName: text(item["wp:post_name"]),
      postType: type,
      postStatus: text(item["wp:status"]) || "draft",
      postContent: text(item["content:encoded"]),
      postExcerpt: text(item["excerpt:encoded"]),
      postPassword: text(item["wp:post_password"]),
      postParent: text(item["wp:post_parent"]) || "0",
      postMimeType: mime,
      guid: text(item["wp:attachment_url"]) || text(item.guid),
      ...(date && !date.startsWith("0000")
        ? {
            postDate: new Date(
              date.replace(" ", "T") + (/Z$/.test(date) ? "" : "Z")
            ),
          }
        : {}),
      ...(gmt && !gmt.startsWith("0000")
        ? {
            postDateGmt: new Date(
              gmt.replace(" ", "T") + (/Z$/.test(gmt) ? "" : "Z")
            ),
          }
        : {}),
      commentStatus: text(item["wp:comment_status"]) || "closed",
      pingStatus: text(item["wp:ping_status"]) || "closed",
    })
    for (const category of array<Record<string, unknown>>(item.category)) {
      const taxonomy = text(category["@_domain"]) || "category"
      if (!["category", "post_tag"].includes(taxonomy)) continue
      data.relationships.push({
        objectId: id,
        termTaxonomyId: term(
          taxonomy,
          text(category),
          text(category["@_nicename"])
        ),
      })
    }
    for (const meta of array<Record<string, unknown>>(item["wp:postmeta"]))
      data.metadata.push({
        postId: id,
        metaKey: text(meta["wp:meta_key"]),
        metaValue: text(meta["wp:meta_value"]),
      })
    for (const comment of array<Record<string, unknown>>(item["wp:comment"]))
      data.comments.push({
        commentId: text(comment["wp:comment_id"]) || String(nextComment++),
        commentPostId: id,
        commentAuthor: text(comment["wp:comment_author"]),
        commentAuthorEmail: text(comment["wp:comment_author_email"]),
        commentAuthorUrl: text(comment["wp:comment_author_url"]),
        commentContent: text(comment["wp:comment_content"]),
        commentApproved: text(comment["wp:comment_approved"]) || "0",
        commentParent: text(comment["wp:comment_parent"]) || "0",
        commentDate: wxrDate(text(comment["wp:comment_date"])),
        commentDateGmt: wxrDate(text(comment["wp:comment_date_gmt"])),
      })
  }
  return importArchive(toolsArchiveSchema.parse({ data }), session.user.id)
}
async function importArchive(
  archive: ToolsArchive,
  authorId: string
): Promise<ImportResult> {
  const data = archive.data
  const sourcePosts = new Map(
    data.posts.filter((post) => post.id).map((post) => [post.id!, post])
  )
  const sourceComments = new Map(
    data.comments.map((comment) => [comment.commentId, comment])
  )
  const sourcePostLanguages = new Map(
    data.postTranslations.map((item) => [item.postId, item])
  )
  const sourceTermLanguages = new Map(
    data.termTranslations.map((item) => [item.termTaxonomyId, item])
  )
  const unique = (values: string[]) => new Set(values).size === values.length
  if (
    !unique(data.posts.flatMap((p) => (p.id ? [p.id] : []))) ||
    !unique(data.terms.map((t) => t.termId)) ||
    !unique(data.taxonomies.map((t) => t.termTaxonomyId)) ||
    !unique(data.comments.map((c) => c.commentId))
  )
    throw new Error("duplicate_archive_id")
  const checkParents = (rows: Array<{ id?: string; parent?: string }>) => {
    const links = new Map(
      rows.filter((row) => row.id).map((row) => [row.id!, row.parent])
    )
    for (const row of rows) {
      const seen = new Set<string>()
      let current = row.id
      for (let depth = 0; current && current !== "0"; depth++) {
        if (seen.has(current) || depth > 100)
          throw new Error("invalid_archive_parent")
        seen.add(current)
        current = links.get(current)
      }
    }
  }
  checkParents(
    data.posts.map((post) => ({
      id: post.id,
      parent: post.postParent ? String(post.postParent) : undefined,
    }))
  )
  checkParents(
    data.comments.map((comment) => ({
      id: comment.commentId,
      parent: comment.commentParent ? String(comment.commentParent) : undefined,
    }))
  )
  checkParents(
    data.taxonomies
      .filter((tax) => tax.taxonomy === "category")
      .map((tax) => ({
        id: tax.termId,
        parent: tax.parent ? String(tax.parent) : undefined,
      }))
  )
  const postIds = new Set(data.posts.flatMap((p) => (p.id ? [p.id] : []))),
    termIds = new Set(data.terms.map((t) => t.termId)),
    taxIds = new Set(data.taxonomies.map((t) => t.termTaxonomyId))
  if (
    data.taxonomies.some((t) => !termIds.has(t.termId)) ||
    data.relationships.some(
      (r) => !postIds.has(r.objectId) || !taxIds.has(r.termTaxonomyId)
    ) ||
    data.comments.some((c) => !postIds.has(c.commentPostId)) ||
    data.metadata.some((m) => !postIds.has(m.postId))
  )
    throw new Error("invalid_archive_reference")
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('pressforge:imports'))`
    )
    await tx.execute(sql`SET LOCAL statement_timeout = '30s'`)
    const languages = await tx
      .select()
      .from(languagesTable)
      .where(eq(languagesTable.isActive, true))
    const fallback = languages.find((l) => l.isDefault)?.code
    if (!fallback) throw new Error("invalid_language")
    const result: ImportResult = {
      success: true,
      postsImported: 0,
      pagesImported: 0,
      categoriesImported: 0,
      tagsImported: 0,
      commentsImported: 0,
      skippedCount: 0,
    }
    const terms = new Map<string, bigint>(),
      taxonomies = new Map<string, bigint>(),
      posts = new Map<string, bigint>(),
      created = new Set<string>(),
      createdTaxonomies = new Set<string>()
    for (const term of data.terms) {
      let [record] = await tx
        .select({ termId: wpTerms.termId })
        .from(wpTerms)
        .where(eq(wpTerms.slug, term.slug))
        .limit(1)
      if (!record)
        [record] = await tx
          .insert(wpTerms)
          .values({ name: contentPlainText(term.name), slug: term.slug })
          .returning({ termId: wpTerms.termId })
      terms.set(term.termId, record.termId)
    }
    const importGroups = new Map<string, string>()
    const group = (kind: string, value: string) => {
      const key = kind + ":" + value
      if (!importGroups.has(key)) importGroups.set(key, randomUUID())
      return importGroups.get(key)!
    }
    for (const tax of data.taxonomies) {
      const termId = terms.get(tax.termId)!
      let [record] = await tx
        .select({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId })
        .from(wpTermTaxonomy)
        .where(
          and(
            eq(wpTermTaxonomy.termId, termId),
            eq(wpTermTaxonomy.taxonomy, tax.taxonomy)
          )
        )
        .limit(1)
      if (!record) {
        ;[record] = await tx
          .insert(wpTermTaxonomy)
          .values({
            termId,
            taxonomy: tax.taxonomy,
            description: contentPlainText(tax.description),
          })
          .returning({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId })
        createdTaxonomies.add(tax.termTaxonomyId)
        if (tax.taxonomy === "category") result.categoriesImported++
        else result.tagsImported++
        const source = sourceTermLanguages.get(tax.termTaxonomyId)
        const locale = source?.languageCode || fallback
        if (!languages.some((l) => l.code === locale))
          throw new Error("invalid_language")
        await tx.insert(termTranslationsTable).values({
          termTaxonomyId: record.termTaxonomyId,
          languageCode: locale,
          translationGroupId: source
            ? group("term", source.translationGroupId)
            : randomUUID(),
        })
      }
      taxonomies.set(tax.termTaxonomyId, record.termTaxonomyId)
    }
    for (const post of data.posts) {
      const postName = post.postName || slug(post.postTitle) || randomUUID()
      let [record] = await tx
        .select({ id: wpPosts.id })
        .from(wpPosts)
        .where(
          and(
            eq(wpPosts.postType, post.postType),
            eq(wpPosts.postName, postName)
          )
        )
        .limit(1)
      if (record) {
        result.skippedCount++
        if (post.id) posts.set(post.id, record.id)
        continue
      }
      const now = new Date()
      const guid = safeMediaUrl(post.guid) || ""
      ;[record] = await tx
        .insert(wpPosts)
        .values({
          postTitle: contentPlainText(post.postTitle),
          postName,
          postContent: renderPostMedia(post.postContent),
          postExcerpt: contentPlainText(post.postExcerpt),
          postStatus: post.postStatus,
          postType: post.postType,
          postAuthor: authorId,
          postDate: post.postDate || now,
          postDateGmt: post.postDateGmt || post.postDate || now,
          postPassword: post.postPassword,
          postMimeType: post.postMimeType,
          guid,
          commentStatus: post.commentStatus,
          pingStatus: post.pingStatus,
        })
        .returning({ id: wpPosts.id })
      if (post.id) {
        posts.set(post.id, record.id)
        created.add(post.id)
      }
      if (post.postType === "post") result.postsImported++
      else if (post.postType === "page") result.pagesImported++
      if (post.postType !== "attachment") {
        const source = sourcePostLanguages.get(post.id || ""),
          locale = source?.languageCode || fallback
        if (!languages.some((l) => l.code === locale))
          throw new Error("invalid_language")
        await tx.insert(postTranslationsTable).values({
          postId: record.id,
          languageCode: locale,
          translationGroupId: source
            ? group("post", source.translationGroupId)
            : randomUUID(),
        })
      }
    }
    for (const post of data.posts)
      if (
        post.id &&
        created.has(post.id) &&
        post.postParent &&
        String(post.postParent) !== "0"
      ) {
        const parent = sourcePosts.get(String(post.postParent))
        const parentId = posts.get(String(post.postParent))
        if (
          parentId &&
          parent &&
          parent.postType === post.postType &&
          ["page", "attachment"].includes(post.postType)
        )
          await tx
            .update(wpPosts)
            .set({ postParent: parentId })
            .where(eq(wpPosts.id, posts.get(post.id)!))
      }
    for (const tax of data.taxonomies)
      if (
        createdTaxonomies.has(tax.termTaxonomyId) &&
        tax.taxonomy === "category" &&
        tax.parent &&
        String(tax.parent) !== "0"
      ) {
        const parent = terms.get(String(tax.parent))
        if (parent)
          await tx
            .update(wpTermTaxonomy)
            .set({ parent })
            .where(
              eq(
                wpTermTaxonomy.termTaxonomyId,
                taxonomies.get(tax.termTaxonomyId)!
              )
            )
      }
    for (const relation of data.relationships)
      if (created.has(relation.objectId))
        await tx
          .insert(wpTermRelationships)
          .values({
            objectId: posts.get(relation.objectId)!,
            termTaxonomyId: taxonomies.get(relation.termTaxonomyId)!,
            termOrder: 0,
          })
          .onConflictDoNothing()
    for (const meta of data.metadata) {
      if (
        !created.has(meta.postId) ||
        !PORTABLE_META_KEYS.some((key) => key === meta.metaKey)
      )
        continue
      let value = meta.metaValue
      if (meta.metaKey === "_thumbnail_id") {
        const target = posts.get(value)
        const image = sourcePosts.get(value)
        if (
          !target ||
          image?.postType !== "attachment" ||
          !image.postMimeType.startsWith("image/")
        )
          continue
        value = String(target)
      }
      if (meta.metaKey === "_featured_video_url") {
        value = featuredVideoUrl(value) || ""
      }
      if (meta.metaKey === "_wp_attached_file") {
        try {
          mediaPathParts(value)
        } catch {
          continue
        }
      }
      if (meta.metaKey === "_wp_attachment_metadata") {
        try {
          const parsed = JSON.parse(value)
          value = JSON.stringify(parsed)
        } catch {
          continue
        }
      }
      await tx.insert(wpPostmeta).values({
        postId: posts.get(meta.postId)!,
        metaKey: meta.metaKey,
        metaValue: value,
      })
    }
    const comments = new Map<string, bigint>()
    for (const comment of data.comments) {
      if (!created.has(comment.commentPostId)) continue
      const [record] = await tx
        .insert(wpComments)
        .values({
          commentPostId: posts.get(comment.commentPostId)!,
          commentAuthor: contentPlainText(comment.commentAuthor),
          commentAuthorEmail: comment.commentAuthorEmail,
          commentAuthorUrl: safeMediaUrl(comment.commentAuthorUrl) || "",
          commentContent: contentPlainText(comment.commentContent),
          commentApproved:
            comment.commentApproved === "pending"
              ? "0"
              : comment.commentApproved,
          commentDate: comment.commentDate || new Date(),
          commentDateGmt:
            comment.commentDateGmt || comment.commentDate || new Date(),
        })
        .returning({ commentId: wpComments.commentId })
      comments.set(comment.commentId, record.commentId)
      result.commentsImported++
    }
    for (const comment of data.comments) {
      const parent = sourceComments.get(String(comment.commentParent))
      const childId = comments.get(comment.commentId),
        parentId = comments.get(String(comment.commentParent))
      if (
        childId &&
        parentId &&
        parent?.commentPostId === comment.commentPostId
      )
        await tx
          .update(wpComments)
          .set({ commentParent: parentId })
          .where(eq(wpComments.commentId, childId))
    }
    await tx.execute(
      sql`UPDATE wp_posts p SET comment_count=(SELECT count(*) FROM wp_comments c WHERE c."comment_post_ID"=p."ID" AND c.comment_approved='1') WHERE p.post_type IN ('post','page')`
    )
    await tx.execute(
      sql`UPDATE wp_term_taxonomy t SET count=(SELECT count(*) FROM wp_term_relationships r JOIN wp_posts p ON p."ID"=r.object_id WHERE r.term_taxonomy_id=t.term_taxonomy_id AND p.post_type='post' AND p.post_status='publish') WHERE t.taxonomy IN ('category','post_tag')`
    )
    return result
  })
}
