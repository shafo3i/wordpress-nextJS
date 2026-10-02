import { db } from "@/db";
import {
  wpPosts,
  wpOptions,
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  user,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

function wrapCdata(content: string | null | undefined): string {
  if (!content) return "<![CDATA[]]>";
  const safe = content.replace(/]]>/g, "]]]]><![CDATA[>");
  return `<![CDATA[${safe}]]>`;
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

async function getSiteConfig() {
  const options = await db
    .select({ optionName: wpOptions.optionName, optionValue: wpOptions.optionValue })
    .from(wpOptions)
    .where(
      sql`${wpOptions.optionName} IN ('siteurl', 'home', 'blogname', 'blogdescription')`
    );

  const map: Record<string, string> = {};
  for (const opt of options) {
    map[opt.optionName] = opt.optionValue;
  }

  let siteUrl = map["siteurl"] || map["home"] || "http://localhost:3000";
  if (siteUrl.endsWith("/")) siteUrl = siteUrl.slice(0, -1);

  return {
    siteUrl,
    blogName: map["blogname"] || "PressForge News",
    blogDesc: map["blogdescription"] || "The Independent News Journal",
  };
}

/**
 * Generates an RSS 2.0 XML syndication feed
 */
export async function generateRssFeed(categorySlug?: string): Promise<string> {
  const { siteUrl, blogName, blogDesc } = await getSiteConfig();

  let postQuery = db
    .select({
      id: wpPosts.id,
      postTitle: wpPosts.postTitle,
      postName: wpPosts.postName,
      postExcerpt: wpPosts.postExcerpt,
      postContent: wpPosts.postContent,
      postDate: wpPosts.postDate,
      authorName: user.name,
      guid: wpPosts.guid,
    })
    .from(wpPosts)
    .leftJoin(user, eq(wpPosts.postAuthor, user.id))
    .where(and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "publish")))
    .orderBy(desc(wpPosts.postDate))
    .limit(25);

  const posts = await postQuery;
  const postIds = posts.map((p) => p.id);

  // Fetch categories for these posts
  let postTermsMap: Record<string, string[]> = {};
  if (postIds.length > 0) {
    const rels = await db
      .select({
        postId: wpTermRelationships.objectId,
        categoryName: wpTerms.name,
      })
      .from(wpTermRelationships)
      .innerJoin(
        wpTermTaxonomy,
        eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
      )
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(
        and(
          eq(wpTermTaxonomy.taxonomy, "category"),
          sql`${wpTermRelationships.objectId} IN (${sql.join(postIds, sql`, `)})`
        )
      );

    for (const r of rels) {
      const pid = String(r.postId);
      if (!postTermsMap[pid]) postTermsMap[pid] = [];
      postTermsMap[pid].push(r.categoryName);
    }
  }

  const feedTitle = categorySlug
    ? `${blogName} — ${categorySlug.toUpperCase()}`
    : blogName;
  const feedLink = categorySlug
    ? `${siteUrl}/category/${categorySlug}`
    : siteUrl;
  const selfFeedUrl = `${siteUrl}/feed${categorySlug ? `?category=${categorySlug}` : ""}`;
  const nowRfc = new Date().toUTCString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
	xmlns:content="http://purl.org/rss/1.0/modules/content/"
	xmlns:wfw="http://wellformedweb.org/CommentAPI/"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:atom="http://www.w3.org/2005/Atom"
	xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
	xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
>

<channel>
	<title>${escapeXml(feedTitle)}</title>
	<atom:link href="${escapeXml(selfFeedUrl)}" rel="self" type="application/rss+xml" />
	<link>${escapeXml(feedLink)}</link>
	<description>${escapeXml(blogDesc)}</description>
	<lastBuildDate>${nowRfc}</lastBuildDate>
	<language>en-US</language>
	<sy:updatePeriod>hourly</sy:updatePeriod>
	<sy:updateFrequency>1</sy:updateFrequency>
	<generator>PressForge Editorial Engine</generator>
`;

  for (const post of posts) {
    const postLink = `${siteUrl}/posts/${post.postName}`;
    const pubDate = post.postDate ? post.postDate.toUTCString() : nowRfc;
    const author = post.authorName || "Editorial Staff";
    const categories = postTermsMap[String(post.id)] || [];

    xml += `\n\t<item>
		<title>${wrapCdata(post.postTitle)}</title>
		<link>${escapeXml(postLink)}</link>
		<pubDate>${pubDate}</pubDate>
		<dc:creator>${wrapCdata(author)}</dc:creator>
		<guid isPermaLink="false">${escapeXml(post.guid || postLink)}</guid>
		<description>${wrapCdata(post.postExcerpt || "")}</description>
		<content:encoded>${wrapCdata(post.postContent || "")}</content:encoded>\n`;

    for (const cat of categories) {
      xml += `\t\t<category>${wrapCdata(cat)}</category>\n`;
    }

    xml += `\t</item>\n`;
  }

  xml += `\n</channel>\n</rss>\n`;
  return xml;
}
