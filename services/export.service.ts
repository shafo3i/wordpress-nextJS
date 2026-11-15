import { checkCmsRateLimit } from "@/lib/rate-limit";
import "server-only"
import { verifyAdmin } from "@/lib/authMIddleware"
import { db } from "@/db"
import {
  wpPosts,
  wpPostmeta,
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  wpComments,
  wpOptions,
  user,
} from "@/db/schema"
import { exportFiltersSchema } from "@/db/schema/cms-tools"
import { PORTABLE_META_KEYS } from "@/db/schema/cms-tools-archive"
import {
  postTranslationsTable,
  termTranslationsTable,
} from "@/db/schema/cms-languages"
import { siteBaseUrl } from "@/lib/seo/urls"
import {
  eq,
  and,
  gte,
  lte,
  desc,
  sql,
  inArray,
  getTableColumns,
  type Table,
} from "drizzle-orm"

export interface ExportFilters {
  format?: "xml" | "sql" | "json"
  content?: "all" | "post" | "page"
  status?: string
  categoryId?: string
  authorId?: string
  startDate?: string
  endDate?: string
}

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return ""
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function wrapCdata(content: string | null | undefined): string {
  if (!content) return "<![CDATA[]]>"
  // CDATA end sequence ]]> cannot be nested, split if present
  const safe = content.replace(/]]>/g, "]]]]><![CDATA[>")
  return `<![CDATA[${safe}]]>`
}

function escapeSqlString(val: unknown): string {
  if (val === null || val === undefined) return "NULL"
  if (typeof val === "number" || typeof val === "bigint") return val.toString()
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE"
  if (val instanceof Date) return `'${val.toISOString()}'`
  if (typeof val === "object") {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''")
    return `'${jsonStr}'`
  }
  const str = String(val).replace(/'/g, "''")
  return `'${str}'`
}

/**
 * Generates a valid WordPress eXtended RSS (WXR 1.2) XML export
 */
export async function exportWxrXml(
  filters: ExportFilters = {}
): Promise<string> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "export");
  filters = exportFiltersSchema.parse(filters)
  // 1. Fetch site options for header
  const optionsRows = await db
    .select()
    .from(wpOptions)
    .where(
      sql`${wpOptions.optionName} IN ('siteurl', 'home', 'blogname', 'blogdescription', 'WPLANG')`
    )

  const optMap: Record<string, string> = {}
  for (const opt of optionsRows) {
    optMap[opt.optionName] = opt.optionValue
  }

  const siteUrl = siteBaseUrl(optMap)
  const blogName = optMap["blogname"] || ""
  const blogDesc = optMap["blogdescription"] || ""

  // 2. Fetch Authors
  const authors = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .limit(10001)

  // 3. Fetch Categories and Tags
  const taxonomyTerms = await db
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      taxonomy: wpTermTaxonomy.taxonomy,
      description: wpTermTaxonomy.description,
      parent: wpTermTaxonomy.parent,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .limit(10001)
  if (taxonomyTerms.length > 10000) throw new Error("export_too_large")

  // 4. Build post query conditions
  const conditions = []

  if (filters.content === "post") {
    conditions.push(eq(wpPosts.postType, "post"))
  } else if (filters.content === "page") {
    conditions.push(eq(wpPosts.postType, "page"))
  } else {
    // "all" exports both posts and pages
    conditions.push(sql`${wpPosts.postType} IN ('post', 'page')`)
  }

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(wpPosts.postStatus, filters.status))
  } else {
    // Exclude auto-drafts and revisions from export
    conditions.push(sql`${wpPosts.postStatus} != 'auto-draft'`)
  }

  if (filters.categoryId && filters.categoryId !== "all") {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM ${wpTermRelationships} r JOIN ${wpTermTaxonomy} t ON t.term_taxonomy_id=r.term_taxonomy_id WHERE r.object_id=${wpPosts.id} AND t.taxonomy='category' AND t.term_id=${BigInt(filters.categoryId)})`
    )
  }

  if (filters.authorId && filters.authorId !== "all") {
    conditions.push(eq(wpPosts.postAuthor, filters.authorId))
  }

  if (filters.startDate) {
    conditions.push(gte(wpPosts.postDate, new Date(filters.startDate)))
  }

  if (filters.endDate) {
    const end = new Date(`${filters.endDate}T23:59:59.999Z`)
    conditions.push(lte(wpPosts.postDate, end))
  }

  const postsQuery = db
    .select()
    .from(wpPosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(wpPosts.postDate))

  const posts = await postsQuery.limit(10001)
  if (posts.length > 10000 || authors.length > 10000)
    throw new Error("export_too_large")
  const postIds = posts.map((p) => p.id)

  // 5. Fetch associated metadata, terms, and comments if posts exist
  const postTermsMap: Record<
    string,
    Array<{ taxonomy: string; slug: string; name: string }>
  > = {}
  const postCommentsMap: Record<string, (typeof wpComments.$inferSelect)[]> = {}
  const postMetaMap: Record<string, Array<{ key: string; value: string }>> = {}

  if (postIds.length > 0) {
    // Relationships & terms
    const relRows = await db
      .select({
        postId: wpTermRelationships.objectId,
        taxonomy: wpTermTaxonomy.taxonomy,
        slug: wpTerms.slug,
        name: wpTerms.name,
      })
      .from(wpTermRelationships)
      .innerJoin(
        wpTermTaxonomy,
        eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
      )
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(
        sql`${wpTermRelationships.objectId} IN (${sql.join(postIds, sql`, `)})`
      )
      .limit(100001)
    if (relRows.length > 100000) throw new Error("export_too_large")

    for (const rel of relRows) {
      const pid = String(rel.postId)
      if (!postTermsMap[pid]) postTermsMap[pid] = []
      postTermsMap[pid].push({
        taxonomy: rel.taxonomy,
        slug: rel.slug,
        name: rel.name,
      })
    }

    // Comments
    const commentRows = await db
      .select()
      .from(wpComments)
      .where(
        sql`${wpComments.commentPostId} IN (${sql.join(postIds, sql`, `)})`
      )
      .limit(100001)
    if (commentRows.length > 100000) throw new Error("export_too_large")

    for (const c of commentRows) {
      const pid = String(c.commentPostId)
      if (!postCommentsMap[pid]) postCommentsMap[pid] = []
      postCommentsMap[pid].push(c)
    }

    // Post Meta
    const metaRows = await db
      .select()
      .from(wpPostmeta)
      .where(sql`${wpPostmeta.postId} IN (${sql.join(postIds, sql`, `)})`)
      .limit(100001)
    if (metaRows.length > 100000) throw new Error("export_too_large")

    for (const m of metaRows) {
      const pid = String(m.postId)
      if (!postMetaMap[pid]) postMetaMap[pid] = []
      if (m.metaKey) {
        postMetaMap[pid].push({
          key: m.metaKey,
          value: m.metaValue || "",
        })
      }
    }
  }

  // 6. Build WXR 1.2 XML Document
  const nowRfc = new Date().toUTCString()

  let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<!-- This is a WordPress eXtended RSS (WXR) file generated by PressForge as an export of your site. -->
<!-- It contains information about your site's posts, pages, comments, categories, and other content. -->
<!-- You may use this file to transfer that content from one site to another. -->
<!-- This file is not intended to serve as a complete backup of your site. -->

<!-- To import this information into a WordPress site: -->
<!-- 1. Log in to that site as an administrator. -->
<!-- 2. Go to Tools: Import in the WordPress admin. -->
<!-- 3. Install the "WordPress" importer from the list. -->
<!-- 4. Activate & Run Importer. -->
<!-- 5. Upload this file using the form provided on that page. -->
<!-- 6. You will first be asked to map the authors in this export file to users on the site. -->

<rss version="2.0"
	xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
	xmlns:content="http://purl.org/rss/1.0/modules/content/"
	xmlns:wfw="http://wellformedweb.org/CommentAPI/"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:wp="http://wordpress.org/export/1.2/"
>

<channel>
	<title>${escapeXml(blogName)}</title>
	<link>${escapeXml(siteUrl)}</link>
	<description>${escapeXml(blogDesc)}</description>
	<pubDate>${nowRfc}</pubDate>
	<language>${escapeXml(optMap["WPLANG"] || "")}</language>
	<wp:wxr_version>1.2</wp:wxr_version>
	<wp:base_site_url>${escapeXml(siteUrl)}</wp:base_site_url>
	<wp:base_blog_url>${escapeXml(siteUrl)}</wp:base_blog_url>

	<!-- Authors -->
`

  for (const [authorIndex, auth] of authors.entries()) {
    xml += `\t<wp:author>
		<wp:author_id>${authorIndex + 1}</wp:author_id>
		<wp:author_login>${wrapCdata(auth.id)}</wp:author_login>
		<wp:author_email>${wrapCdata(auth.email)}</wp:author_email>
		<wp:author_display_name>${wrapCdata(auth.name)}</wp:author_display_name>
		<wp:author_first_name>${wrapCdata("")}</wp:author_first_name>
		<wp:author_last_name>${wrapCdata("")}</wp:author_last_name>
	</wp:author>\n`
  }

  xml += `\n\t<!-- Categories & Tags -->\n`
  const categorySlugs = new Map(
    taxonomyTerms
      .filter((term) => term.taxonomy === "category")
      .map((term) => [String(term.termId), term.slug])
  )
  for (const item of taxonomyTerms) {
    if (item.taxonomy === "category") {
      xml += `\t<wp:category>
		<wp:term_id>${item.termId}</wp:term_id>
		<wp:category_nicename>${escapeXml(item.slug)}</wp:category_nicename>
		<wp:category_parent>${escapeXml(categorySlugs.get(String(item.parent)) || "")}</wp:category_parent>
		<wp:cat_name>${wrapCdata(item.name)}</wp:cat_name>
		<wp:category_description>${wrapCdata(item.description)}</wp:category_description>
	</wp:category>\n`
    } else if (item.taxonomy === "post_tag") {
      xml += `\t<wp:tag>
		<wp:term_id>${item.termId}</wp:term_id>
		<wp:tag_slug>${escapeXml(item.slug)}</wp:tag_slug>
		<wp:tag_name>${wrapCdata(item.name)}</wp:tag_name>
		<wp:tag_description>${wrapCdata(item.description)}</wp:tag_description>
	</wp:tag>\n`
    }
  }

  xml += `\n\t<!-- Items (Posts & Pages) -->\n`
  for (const p of posts) {
    const pid = String(p.id)
    const pDate = p.postDate
      ? p.postDate.toISOString().replace("T", " ").substring(0, 19)
      : ""
    const pDateGmt = p.postDateGmt
      ? p.postDateGmt.toISOString().replace("T", " ").substring(0, 19)
      : ""
    const postLink = `${siteUrl}/${p.postType === "page" ? "" : "posts/"}${p.postName}`

    xml += `\t<item>
		<title>${wrapCdata(p.postTitle)}</title>
		<link>${escapeXml(postLink)}</link>
		<pubDate>${p.postDate ? p.postDate.toUTCString() : ""}</pubDate>
		<dc:creator>${wrapCdata(p.postAuthor || "")}</dc:creator>
		<guid isPermaLink="false">${escapeXml(p.guid || postLink)}</guid>
		<description></description>
		<content:encoded>${wrapCdata(p.postContent)}</content:encoded>
		<excerpt:encoded>${wrapCdata(p.postExcerpt)}</excerpt:encoded>
		<wp:post_id>${p.id}</wp:post_id>
		<wp:post_date>${wrapCdata(pDate)}</wp:post_date>
		<wp:post_date_gmt>${wrapCdata(pDateGmt)}</wp:post_date_gmt>
		<wp:comment_status>${wrapCdata(p.commentStatus)}</wp:comment_status>
		<wp:ping_status>${wrapCdata(p.pingStatus)}</wp:ping_status>
		<wp:post_name>${wrapCdata(p.postName)}</wp:post_name>
		<wp:status>${wrapCdata(p.postStatus)}</wp:status>
		<wp:post_parent>${p.postParent}</wp:post_parent>
		<wp:menu_order>${p.menuOrder}</wp:menu_order>
		<wp:post_type>${wrapCdata(p.postType)}</wp:post_type>
		<wp:post_password>${wrapCdata(p.postPassword)}</wp:post_password>
		<wp:is_sticky>0</wp:is_sticky>\n`

    // Attached categories & tags
    const terms = postTermsMap[pid] || []
    for (const t of terms) {
      xml += `\t\t<category domain="${escapeXml(t.taxonomy)}" nicename="${escapeXml(t.slug)}">${wrapCdata(t.name)}</category>\n`
    }

    // Post Meta
    const metas = postMetaMap[pid] || []
    for (const m of metas) {
      xml += `\t\t<wp:postmeta>
			<wp:meta_key>${wrapCdata(m.key)}</wp:meta_key>
			<wp:meta_value>${wrapCdata(m.value)}</wp:meta_value>
		</wp:postmeta>\n`
    }

    // Comments
    const comments = postCommentsMap[pid] || []
    for (const c of comments) {
      const cDate = c.commentDate
        ? c.commentDate.toISOString().replace("T", " ").substring(0, 19)
        : ""
      const cDateGmt = c.commentDateGmt
        ? c.commentDateGmt.toISOString().replace("T", " ").substring(0, 19)
        : ""

      xml += `\t\t<wp:comment>
			<wp:comment_id>${c.commentId}</wp:comment_id>
			<wp:comment_author>${wrapCdata(c.commentAuthor)}</wp:comment_author>
			<wp:comment_author_email>${wrapCdata(c.commentAuthorEmail)}</wp:comment_author_email>
			<wp:comment_author_url>${wrapCdata(c.commentAuthorUrl)}</wp:comment_author_url>
			<wp:comment_author_IP>${wrapCdata(c.commentAuthorIp)}</wp:comment_author_IP>
			<wp:comment_date>${wrapCdata(cDate)}</wp:comment_date>
			<wp:comment_date_gmt>${wrapCdata(cDateGmt)}</wp:comment_date_gmt>
			<wp:comment_content>${wrapCdata(c.commentContent)}</wp:comment_content>
			<wp:comment_approved>${wrapCdata(c.commentApproved)}</wp:comment_approved>
			<wp:comment_type>${wrapCdata(c.commentType)}</wp:comment_type>
			<wp:comment_parent>${c.commentParent}</wp:comment_parent>
			<wp:comment_user_id>${c.userId || 0}</wp:comment_user_id>
		</wp:comment>\n`
    }

    xml += `\t</item>\n`
    if (Buffer.byteLength(xml) > 50 * 1024 * 1024)
      throw new Error("export_too_large")
  }

  xml += `</channel>\n</rss>\n`
  return xml
}

/** Data-only editorial SQL. Existing schema required; not a pg_dump or full backup. */
export async function exportSqlDump(): Promise<string> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "export");
  const archive = await editorialSnapshot({})
  const tables: Array<{
    name: string
    table: Table
    rows: Record<string, unknown>[]
  }> = [
    { name: "user", table: user, rows: archive.data.authors },
    { name: "wp_terms", table: wpTerms, rows: archive.data.terms },
    {
      name: "wp_term_taxonomy",
      table: wpTermTaxonomy,
      rows: archive.data.taxonomies,
    },
    { name: "wp_posts", table: wpPosts, rows: archive.data.posts },
    { name: "wp_postmeta", table: wpPostmeta, rows: archive.data.metadata },
    {
      name: "wp_term_relationships",
      table: wpTermRelationships,
      rows: archive.data.relationships,
    },
    { name: "wp_comments", table: wpComments, rows: archive.data.comments },
    {
      name: "cms_post_translations",
      table: postTranslationsTable,
      rows: archive.data.postTranslations,
    },
    {
      name: "cms_term_translations",
      table: termTranslationsTable,
      rows: archive.data.termTranslations,
    },
  ]
  let output = `-- PressForge editorial data only; existing schema, users and languages must be prepared.
-- No authentication credentials, settings, physical media files or schema DDL.
SET standard_conforming_strings = on;
BEGIN;
`
  for (const { name, table, rows } of tables) {
    const columns = getTableColumns(table)
    for (const row of rows) {
      const keys = Object.keys(row).filter((key) => columns[key])
      output += `INSERT INTO "${name}" (${keys.map((key) => `"${columns[key].name}"`).join(", ")}) VALUES (${keys.map((key) => escapeSqlString(row[key])).join(", ")}) ${name === "user" ? "ON CONFLICT (id) DO NOTHING" : ""};\n`
      if (Buffer.byteLength(output) > 50 * 1024 * 1024)
        throw new Error("export_too_large")
    }
    for (const column of Object.values(columns))
      if (column.columnType.startsWith("PgBigSerial")) {
        output += `SELECT setval(pg_get_serial_sequence('${name}', '${column.name}'), COALESCE((SELECT MAX("${column.name}") FROM "${name}"), 1), EXISTS(SELECT 1 FROM "${name}"));\n`
      }
  }
  return output + "COMMIT;\n"
}
async function editorialSnapshot(input: ExportFilters) {
  const filters = exportFiltersSchema.parse(input)
  return db.transaction(
    async (tx) => {
      await tx.execute(sql`SET LOCAL statement_timeout = '30s'`)
      const conditions = [
        sql`${wpPosts.postType} IN ('post','page','attachment')`,
        sql`${wpPosts.postStatus} != 'auto-draft'`,
      ]
      if (filters.content !== "all")
        conditions.push(eq(wpPosts.postType, filters.content))
      if (filters.status !== "all")
        conditions.push(eq(wpPosts.postStatus, filters.status))
      if (filters.authorId && filters.authorId !== "all")
        conditions.push(eq(wpPosts.postAuthor, filters.authorId))
      if (filters.startDate)
        conditions.push(gte(wpPosts.postDate, new Date(filters.startDate)))
      if (filters.endDate)
        conditions.push(
          lte(wpPosts.postDate, new Date(`${filters.endDate}T23:59:59.999Z`))
        )
      if (filters.categoryId && filters.categoryId !== "all")
        conditions.push(
          sql`EXISTS (SELECT 1 FROM wp_term_relationships r JOIN wp_term_taxonomy t ON t.term_taxonomy_id=r.term_taxonomy_id WHERE r.object_id=${wpPosts.id} AND t.taxonomy='category' AND t.term_id=${BigInt(filters.categoryId)})`
        )
      const posts = await tx
        .select()
        .from(wpPosts)
        .where(and(...conditions))
        .limit(10001)
      const postIds = posts.map((post) => post.id)
      const [
        terms,
        taxonomies,
        relationships,
        comments,
        metadata,
        authors,
        postTranslations,
        termTranslations,
      ] = await Promise.all([
        tx
          .select()
          .from(wpTerms)
          .where(
            sql`EXISTS (SELECT 1 FROM wp_term_taxonomy t WHERE t.term_id=${wpTerms.termId} AND t.taxonomy IN ('category','post_tag'))`
          )
          .limit(10001),
        tx
          .select()
          .from(wpTermTaxonomy)
          .where(inArray(wpTermTaxonomy.taxonomy, ["category", "post_tag"]))
          .limit(10001),
        postIds.length
          ? tx
              .select()
              .from(wpTermRelationships)
              .where(
                and(
                  inArray(wpTermRelationships.objectId, postIds),
                  sql`EXISTS (SELECT 1 FROM wp_term_taxonomy t WHERE t.term_taxonomy_id=${wpTermRelationships.termTaxonomyId} AND t.taxonomy IN ('category','post_tag'))`
                )
              )
              .limit(100001)
          : [],
        postIds.length
          ? tx
              .select({
                commentId: wpComments.commentId,
                commentPostId: wpComments.commentPostId,
                commentAuthor: wpComments.commentAuthor,
                commentAuthorEmail: wpComments.commentAuthorEmail,
                commentAuthorUrl: wpComments.commentAuthorUrl,
                commentContent: wpComments.commentContent,
                commentApproved: wpComments.commentApproved,
                commentParent: wpComments.commentParent,
                commentDate: wpComments.commentDate,
                commentDateGmt: wpComments.commentDateGmt,
              })
              .from(wpComments)
              .where(inArray(wpComments.commentPostId, postIds))
              .limit(100001)
          : [],
        postIds.length
          ? tx
              .select()
              .from(wpPostmeta)
              .where(
                and(
                  inArray(wpPostmeta.postId, postIds),
                  inArray(wpPostmeta.metaKey, [...PORTABLE_META_KEYS])
                )
              )
              .limit(100001)
          : [],
        tx
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .limit(10001),
        postIds.length
          ? tx
              .select()
              .from(postTranslationsTable)
              .where(inArray(postTranslationsTable.postId, postIds))
              .limit(10001)
          : [],
        tx
          .select()
          .from(termTranslationsTable)
          .where(
            sql`EXISTS (SELECT 1 FROM wp_term_taxonomy t WHERE t.term_taxonomy_id=${termTranslationsTable.termTaxonomyId} AND t.taxonomy IN ('category','post_tag'))`
          )
          .limit(10001),
      ])
      if (
        [
          posts,
          terms,
          taxonomies,
          authors,
          postTranslations,
          termTranslations,
        ].some((rows) => rows.length > 10000) ||
        [relationships, comments, metadata].some((rows) => rows.length > 100000)
      )
        throw new Error("export_too_large")
      return {
        generator: "PressForge CMS",
        version: "2.0.0",
        scope: "editorial-content",
        exportedAt: new Date().toISOString(),
        stats: {
          postsCount: posts.length,
          termsCount: terms.length,
          commentsCount: comments.length,
        },
        data: {
          authors,
          terms,
          taxonomies,
          relationships,
          posts,
          comments,
          metadata,
          postTranslations,
          termTranslations,
        },
      }
    },
    { isolationLevel: "repeatable read", accessMode: "read only" }
  )
}
export async function exportJsonArchive(
  filters: ExportFilters = {}
): Promise<string> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "export");
  const result = JSON.stringify(
    await editorialSnapshot(filters),
    (_, value) => (typeof value === "bigint" ? String(value) : value),
    2
  )
  if (Buffer.byteLength(result) > 50 * 1024 * 1024)
    throw new Error("export_too_large")
  return result
}
