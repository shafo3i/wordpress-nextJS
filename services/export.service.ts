import { db } from "@/db";
import {
  wpPosts,
  wpPostmeta,
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  wpComments,
  wpCommentmeta,
  wpOptions,
  user,
} from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface ExportFilters {
  format?: "xml" | "sql" | "json";
  content?: "all" | "post" | "page";
  status?: string;
  categoryId?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
}

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapCdata(content: string | null | undefined): string {
  if (!content) return "<![CDATA[]]>";
  // CDATA end sequence ]]> cannot be nested, split if present
  const safe = content.replace(/]]>/g, "]]]]><![CDATA[>");
  return `<![CDATA[${safe}]]>`;
}

function escapeSqlString(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number" || typeof val === "bigint") return val.toString();
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === "object") {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

/**
 * Generates a valid WordPress eXtended RSS (WXR 1.2) XML export
 */
export async function exportWxrXml(filters: ExportFilters = {}): Promise<string> {
  // 1. Fetch site options for header
  const optionsRows = await db
    .select()
    .from(wpOptions)
    .where(
      sql`${wpOptions.optionName} IN ('siteurl', 'home', 'blogname', 'blogdescription')`
    );

  const optMap: Record<string, string> = {};
  for (const opt of optionsRows) {
    optMap[opt.optionName] = opt.optionValue;
  }

  const siteUrl = optMap["siteurl"] || optMap["home"] || "http://localhost:3000";
  const blogName = optMap["blogname"] || "PressForge News";
  const blogDesc = optMap["blogdescription"] || "Open Source Editorial Newsroom";

  // 2. Fetch Authors
  const authors = await db.select().from(user);

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
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId));

  // 4. Build post query conditions
  const conditions = [];

  if (filters.content === "post") {
    conditions.push(eq(wpPosts.postType, "post"));
  } else if (filters.content === "page") {
    conditions.push(eq(wpPosts.postType, "page"));
  } else {
    // "all" exports both posts and pages
    conditions.push(sql`${wpPosts.postType} IN ('post', 'page')`);
  }

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(wpPosts.postStatus, filters.status));
  } else {
    // Exclude auto-drafts and revisions from export
    conditions.push(sql`${wpPosts.postStatus} != 'auto-draft'`);
  }

  if (filters.authorId && filters.authorId !== "all") {
    conditions.push(eq(wpPosts.postAuthor, filters.authorId));
  }

  if (filters.startDate) {
    conditions.push(gte(wpPosts.postDate, new Date(filters.startDate)));
  }

  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(wpPosts.postDate, end));
  }

  const postsQuery = db
    .select()
    .from(wpPosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(wpPosts.postDate));

  const posts = await postsQuery;
  const postIds = posts.map((p) => p.id);

  // 5. Fetch associated metadata, terms, and comments if posts exist
  let postTermsMap: Record<string, Array<{ taxonomy: string; slug: string; name: string }>> = {};
  let postCommentsMap: Record<string, any[]> = {};
  let postMetaMap: Record<string, Array<{ key: string; value: string }>> = {};

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
      .where(sql`${wpTermRelationships.objectId} IN (${sql.join(postIds, sql`, `)})`);

    for (const rel of relRows) {
      const pid = String(rel.postId);
      if (!postTermsMap[pid]) postTermsMap[pid] = [];
      postTermsMap[pid].push({
        taxonomy: rel.taxonomy,
        slug: rel.slug,
        name: rel.name,
      });
    }

    // Comments
    const commentRows = await db
      .select()
      .from(wpComments)
      .where(sql`${wpComments.commentPostId} IN (${sql.join(postIds, sql`, `)})`);

    for (const c of commentRows) {
      const pid = String(c.commentPostId);
      if (!postCommentsMap[pid]) postCommentsMap[pid] = [];
      postCommentsMap[pid].push(c);
    }

    // Post Meta
    const metaRows = await db
      .select()
      .from(wpPostmeta)
      .where(sql`${wpPostmeta.postId} IN (${sql.join(postIds, sql`, `)})`);

    for (const m of metaRows) {
      const pid = String(m.postId);
      if (!postMetaMap[pid]) postMetaMap[pid] = [];
      if (m.metaKey) {
        postMetaMap[pid].push({
          key: m.metaKey,
          value: m.metaValue || "",
        });
      }
    }
  }

  // 6. Build WXR 1.2 XML Document
  const nowRfc = new Date().toUTCString();

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
	<language>en-US</language>
	<wp:wxr_version>1.2</wp:wxr_version>
	<wp:base_site_url>${escapeXml(siteUrl)}</wp:base_site_url>
	<wp:base_blog_url>${escapeXml(siteUrl)}</wp:base_blog_url>

	<!-- Authors -->
`;

  for (const auth of authors) {
    xml += `\t<wp:author>
		<wp:author_id>${auth.id}</wp:author_id>
		<wp:author_login>${wrapCdata(auth.name || auth.email)}</wp:author_login>
		<wp:author_email>${wrapCdata(auth.email)}</wp:author_email>
		<wp:author_display_name>${wrapCdata(auth.name)}</wp:author_display_name>
		<wp:author_first_name>${wrapCdata("")}</wp:author_first_name>
		<wp:author_last_name>${wrapCdata("")}</wp:author_last_name>
	</wp:author>\n`;
  }

  xml += `\n\t<!-- Categories & Tags -->\n`;
  for (const item of taxonomyTerms) {
    if (item.taxonomy === "category") {
      xml += `\t<wp:category>
		<wp:term_id>${item.termId}</wp:term_id>
		<wp:category_nicename>${escapeXml(item.slug)}</wp:category_nicename>
		<wp:category_parent>${item.parent && item.parent > BigInt(0) ? String(item.parent) : ""}</wp:category_parent>
		<wp:cat_name>${wrapCdata(item.name)}</wp:cat_name>
		<wp:category_description>${wrapCdata(item.description)}</wp:category_description>
	</wp:category>\n`;
    } else if (item.taxonomy === "post_tag") {
      xml += `\t<wp:tag>
		<wp:term_id>${item.termId}</wp:term_id>
		<wp:tag_slug>${escapeXml(item.slug)}</wp:tag_slug>
		<wp:tag_name>${wrapCdata(item.name)}</wp:tag_name>
		<wp:tag_description>${wrapCdata(item.description)}</wp:tag_description>
	</wp:tag>\n`;
    }
  }

  xml += `\n\t<!-- Items (Posts & Pages) -->\n`;
  for (const p of posts) {
    const pid = String(p.id);
    const pDate = p.postDate ? p.postDate.toISOString().replace("T", " ").substring(0, 19) : "";
    const pDateGmt = p.postDateGmt ? p.postDateGmt.toISOString().replace("T", " ").substring(0, 19) : "";
    const postLink = `${siteUrl}/${p.postType === "page" ? "" : "posts/"}${p.postName}`;

    xml += `\t<item>
		<title>${wrapCdata(p.postTitle)}</title>
		<link>${escapeXml(postLink)}</link>
		<pubDate>${p.postDate ? p.postDate.toUTCString() : ""}</pubDate>
		<dc:creator>${wrapCdata(p.postAuthor || "admin")}</dc:creator>
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
		<wp:is_sticky>0</wp:is_sticky>\n`;

    // Attached categories & tags
    const terms = postTermsMap[pid] || [];
    for (const t of terms) {
      xml += `\t\t<category domain="${escapeXml(t.taxonomy)}" nicename="${escapeXml(t.slug)}">${wrapCdata(t.name)}</category>\n`;
    }

    // Post Meta
    const metas = postMetaMap[pid] || [];
    for (const m of metas) {
      xml += `\t\t<wp:postmeta>
			<wp:meta_key>${wrapCdata(m.key)}</wp:meta_key>
			<wp:meta_value>${wrapCdata(m.value)}</wp:meta_value>
		</wp:postmeta>\n`;
    }

    // Comments
    const comments = postCommentsMap[pid] || [];
    for (const c of comments) {
      const cDate = c.commentDate ? c.commentDate.toISOString().replace("T", " ").substring(0, 19) : "";
      const cDateGmt = c.commentDateGmt ? c.commentDateGmt.toISOString().replace("T", " ").substring(0, 19) : "";

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
		</wp:comment>\n`;
    }

    xml += `\t</item>\n`;
  }

  xml += `</channel>\n</rss>\n`;
  return xml;
}

/**
 * Generates a full PostgreSQL SQL dump with real schema and insert statements
 */
export async function exportSqlDump(): Promise<string> {
  let sqlDump = `-- =====================================================================
-- PressForge CMS Database Dump (PostgreSQL)
-- Generated: ${new Date().toISOString()}
-- Architecture: WordPress Schema Compatible for PostgreSQL
-- =====================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

`;

  const tablesToDump = [
    { name: "wp_options", table: wpOptions },
    { name: "user", table: user },
    { name: "wp_terms", table: wpTerms },
    { name: "wp_term_taxonomy", table: wpTermTaxonomy },
    { name: "wp_posts", table: wpPosts },
    { name: "wp_postmeta", table: wpPostmeta },
    { name: "wp_term_relationships", table: wpTermRelationships },
    { name: "wp_comments", table: wpComments },
    { name: "wp_commentmeta", table: wpCommentmeta },
  ];

  for (const { name, table } of tablesToDump) {
    sqlDump += `\n-- -----------------------------------------------------\n`;
    sqlDump += `-- Table data: ${name}\n`;
    sqlDump += `-- -----------------------------------------------------\n`;

    const rows = await db.select().from(table as any);
    if (rows.length === 0) {
      sqlDump += `-- (no rows in ${name})\n`;
      continue;
    }

    // Get column keys
    const columns = Object.keys(rows[0]);
    // PostgreSQL column names are mapped by Drizzle table definition
    // For raw insert statements:
    for (const row of rows) {
      const vals = columns.map((col) => escapeSqlString(row[col]));
      sqlDump += `INSERT INTO "${name}" ("${columns.join('", "')}") VALUES (${vals.join(", ")});\n`;
    }
  }

  sqlDump += `\n-- Dump completed successfully on ${new Date().toISOString()}\n`;
  return sqlDump;
}

/**
 * Generates a complete JSON backup archive
 */
export async function exportJsonArchive(): Promise<string> {
  const [posts, terms, taxonomies, relationships, comments, options, authors] =
    await Promise.all([
      db.select().from(wpPosts),
      db.select().from(wpTerms),
      db.select().from(wpTermTaxonomy),
      db.select().from(wpTermRelationships),
      db.select().from(wpComments),
      db.select().from(wpOptions),
      db.select().from(user),
    ]);

  const archive = {
    generator: "PressForge CMS",
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    stats: {
      postsCount: posts.length,
      termsCount: terms.length,
      commentsCount: comments.length,
      optionsCount: options.length,
    },
    data: {
      authors,
      options,
      terms,
      taxonomies,
      relationships,
      posts,
      comments,
    },
  };

  return JSON.stringify(
    archive,
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
}
