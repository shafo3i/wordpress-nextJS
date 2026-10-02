import type { MetadataRoute } from "next";
import { db } from "@/db";
import { wpPosts, wpOptions, wpTerms, wpTermTaxonomy, wpPostmeta } from "@/db/schema";
import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function getBaseSiteUrl(): Promise<string> {
  try {
    const row = await db
      .select({ optionValue: wpOptions.optionValue })
      .from(wpOptions)
      .where(sql`${wpOptions.optionName} IN ('siteurl', 'home')`)
      .limit(1);

    if (row.length > 0 && row[0].optionValue) {
      let url = row[0].optionValue.trim();
      if (url.endsWith("/")) url = url.slice(0, -1);
      return url;
    }
  } catch {
    // fallback
  }
  return "http://localhost:3000";
}

/**
 * Returns type-safe Sitemap entries adhering to Next.js MetadataRoute.Sitemap convention
 */
export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseSiteUrl();

  const [posts, pages, categories] = await Promise.all([
    db
      .select({
        id: wpPosts.id,
        postName: wpPosts.postName,
        postDate: wpPosts.postDate,
        postModified: wpPosts.postModified,
        postTitle: wpPosts.postTitle,
      })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "publish")))
      .orderBy(desc(wpPosts.postDate)),

    db
      .select({
        id: wpPosts.id,
        postName: wpPosts.postName,
        postDate: wpPosts.postDate,
        postModified: wpPosts.postModified,
      })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "page"), eq(wpPosts.postStatus, "publish")))
      .orderBy(desc(wpPosts.postDate)),

    db
      .select({
        slug: wpTerms.slug,
      })
      .from(wpTerms)
      .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
      .where(eq(wpTermTaxonomy.taxonomy, "category")),
  ]);

  // Fetch images for posts if any
  const postIds = posts.map((p) => p.id);
  const imageMap = new Map<string, string>();
  if (postIds.length > 0) {
    try {
      const metas = await db
        .select({
          postId: wpPostmeta.postId,
          metaValue: wpPostmeta.metaValue,
        })
        .from(wpPostmeta)
        .where(
          and(
            inArray(wpPostmeta.postId, postIds),
            eq(wpPostmeta.metaKey, "_thumbnail_id")
          )
        );

      const attachmentIds = metas
        .map((m) => m.metaValue)
        .filter((v): v is string => Boolean(v) && !isNaN(Number(v)));

      if (attachmentIds.length > 0) {
        const attachments = await db
          .select({
            id: wpPosts.id,
            guid: wpPosts.guid,
          })
          .from(wpPosts)
          .where(
            and(
              inArray(wpPosts.id, attachmentIds.map((id) => BigInt(id))),
              eq(wpPosts.postType, "attachment")
            )
          );

        const attMap = new Map<string, string>();
        for (const att of attachments) {
          if (att.guid) {
            attMap.set(att.id.toString(), att.guid);
          }
        }

        for (const meta of metas) {
          if (meta.metaValue && attMap.has(meta.metaValue)) {
            imageMap.set(meta.postId.toString(), attMap.get(meta.metaValue)!);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
  ];

  for (const cat of categories) {
    entries.push({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const post of posts) {
    const img = imageMap.get(post.id.toString());
    entries.push({
      url: `${baseUrl}/posts/${post.postName}`,
      lastModified: post.postModified || post.postDate || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      ...(img ? { images: [img] } : {}),
    });
  }

  for (const page of pages) {
    entries.push({
      url: `${baseUrl}/${page.postName}`,
      lastModified: page.postModified || page.postDate || new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}

/**
 * Generates Google News XML Sitemap (articles published in the last 48 hours)
 * Google News requires specialized <news:news> XML tags not supported by standard Sitemap protocol
 */
export async function generateNewsSitemapXml(): Promise<string> {
  const baseUrl = await getBaseSiteUrl();

  const siteOption = await db
    .select({ optionValue: wpOptions.optionValue })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, "blogname"))
    .limit(1);

  const publicationName = siteOption[0]?.optionValue || "PressForge News";

  // Google News requires articles published in the last 48 hours
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  let newsPosts = await db
    .select({
      postName: wpPosts.postName,
      postDate: wpPosts.postDate,
      postTitle: wpPosts.postTitle,
    })
    .from(wpPosts)
    .where(
      and(
        eq(wpPosts.postType, "post"),
        eq(wpPosts.postStatus, "publish"),
        gte(wpPosts.postDate, twoDaysAgo)
      )
    )
    .orderBy(desc(wpPosts.postDate))
    .limit(100);

  // If newly seeded or development environment has older articles, include latest 10
  if (newsPosts.length === 0) {
    newsPosts = await db
      .select({
        postName: wpPosts.postName,
        postDate: wpPosts.postDate,
        postTitle: wpPosts.postTitle,
      })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "publish")))
      .orderBy(desc(wpPosts.postDate))
      .limit(10);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

  for (const post of newsPosts) {
    const pubDate = (post.postDate || new Date()).toISOString();
    xml += `  <url>
    <loc>${escapeXml(baseUrl)}/posts/${escapeXml(post.postName)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(publicationName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.postTitle)}</news:title>
    </news:news>
  </url>\n`;
  }

  xml += `</urlset>\n`;
  return xml;
}

/**
 * Returns summary counts for the SEO & Sitemaps dashboard
 */
export async function getSitemapStats() {
  const [postsCount, pagesCount, categoriesCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "publish"))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(wpPosts)
      .where(and(eq(wpPosts.postType, "page"), eq(wpPosts.postStatus, "publish"))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(wpTermTaxonomy)
      .where(eq(wpTermTaxonomy.taxonomy, "category")),
  ]);

  return {
    indexedPosts: postsCount[0]?.count || 0,
    indexedPages: pagesCount[0]?.count || 0,
    indexedCategories: categoriesCount[0]?.count || 0,
    totalUrls: (postsCount[0]?.count || 0) + (pagesCount[0]?.count || 0) + (categoriesCount[0]?.count || 0) + 1,
  };
}
