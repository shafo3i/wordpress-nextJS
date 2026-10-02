import { db } from "@/db";
import {
  wpPosts,
  wpPostmeta,
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  wpComments,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";

export interface ImportResult {
  success: boolean;
  postsImported: number;
  pagesImported: number;
  categoriesImported: number;
  tagsImported: number;
  commentsImported: number;
  skippedCount: number;
  message?: string;
}

function extractText(node: any): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return node.toString();
  if (node.__cdata !== undefined) return String(node.__cdata);
  if (node["#text"] !== undefined) return String(node["#text"]);
  return "";
}

function ensureArray<T>(item: T | T[] | undefined | null): T[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

/**
 * Imports content from a WordPress eXtended RSS (WXR 1.2) XML file
 */
export async function importWxrXml(
  xmlContent: string,
  fallbackAuthorId: string
): Promise<ImportResult> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    cdataPropName: "__cdata",
    trimValues: true,
    parseTagValue: false,
  });

  const parsed = parser.parse(xmlContent);
  const channel = parsed?.rss?.channel;

  if (!channel) {
    throw new Error("Invalid WordPress XML export file: missing <rss><channel> root.");
  }

  let postsImported = 0;
  let pagesImported = 0;
  let categoriesImported = 0;
  let tagsImported = 0;
  let commentsImported = 0;
  let skippedCount = 0;

  // 1. Process Categories (<wp:category>)
  const categories = ensureArray(channel["wp:category"]);
  for (const cat of categories) {
    const rawName = extractText(cat["wp:cat_name"]);
    const rawSlug = extractText(cat["wp:category_nicename"]) || slugify(rawName);
    const desc = extractText(cat["wp:category_description"]);

    if (!rawName || !rawSlug) continue;

    // Check if term already exists
    const existing = await db
      .select({ termId: wpTerms.termId })
      .from(wpTerms)
      .where(eq(wpTerms.slug, rawSlug))
      .limit(1);

    if (existing.length === 0) {
      const [newTerm] = await db
        .insert(wpTerms)
        .values({
          name: rawName,
          slug: rawSlug,
        })
        .returning({ termId: wpTerms.termId });

      await db.insert(wpTermTaxonomy).values({
        termId: newTerm.termId,
        taxonomy: "category",
        description: desc,
      });

      categoriesImported++;
    }
  }

  // 2. Process Tags (<wp:tag>)
  const tags = ensureArray(channel["wp:tag"]);
  for (const tag of tags) {
    const rawName = extractText(tag["wp:tag_name"]);
    const rawSlug = extractText(tag["wp:tag_slug"]) || slugify(rawName);
    const desc = extractText(tag["wp:tag_description"]);

    if (!rawName || !rawSlug) continue;

    const existing = await db
      .select({ termId: wpTerms.termId })
      .from(wpTerms)
      .where(eq(wpTerms.slug, rawSlug))
      .limit(1);

    if (existing.length === 0) {
      const [newTerm] = await db
        .insert(wpTerms)
        .values({
          name: rawName,
          slug: rawSlug,
        })
        .returning({ termId: wpTerms.termId });

      await db.insert(wpTermTaxonomy).values({
        termId: newTerm.termId,
        taxonomy: "post_tag",
        description: desc,
      });

      tagsImported++;
    }
  }

  // Pre-load all taxonomy terms into memory for fast post relationship mapping
  const allTerms = await db
    .select({
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
      taxonomy: wpTermTaxonomy.taxonomy,
      slug: wpTerms.slug,
      name: wpTerms.name,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId));

  const termLookup = new Map<string, bigint>();
  for (const t of allTerms) {
    termLookup.set(`${t.taxonomy}:${t.slug.toLowerCase()}`, t.termTaxonomyId);
    termLookup.set(`${t.taxonomy}:${t.name.toLowerCase()}`, t.termTaxonomyId);
  }

  // 3. Process Items (<item>)
  const items = ensureArray(channel["item"]);

  for (const item of items) {
    const postType = extractText(item["wp:post_type"]) || "post";
    // We only import posts and pages, skip attachments/nav_menu_items if not needed
    if (postType !== "post" && postType !== "page") {
      continue;
    }

    const title = extractText(item["title"]) || "Untitled Post";
    let postSlug = extractText(item["wp:post_name"]) || slugify(title);
    if (!postSlug) {
      postSlug = `post-${Date.now()}`;
    }

    // Check if post already exists by slug and postType
    const existingPost = await db
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(and(eq(wpPosts.postName, postSlug), eq(wpPosts.postType, postType)))
      .limit(1);

    if (existingPost.length > 0) {
      skippedCount++;
      continue;
    }

    const content = extractText(item["content:encoded"]) || "";
    const excerpt = extractText(item["excerpt:encoded"]) || "";
    const postStatus = extractText(item["wp:status"]) || "publish";
    const commentStatus = extractText(item["wp:comment_status"]) || "open";
    const pingStatus = extractText(item["wp:ping_status"]) || "open";
    const guid = extractText(item["guid"]) || "";

    const rawDate = extractText(item["wp:post_date"]);
    const postDate = rawDate ? new Date(rawDate) : new Date();
    const rawDateGmt = extractText(item["wp:post_date_gmt"]);
    const postDateGmt = rawDateGmt ? new Date(rawDateGmt) : postDate;

    // Insert Post
    const [insertedPost] = await db
      .insert(wpPosts)
      .values({
        postTitle: title,
        postName: postSlug,
        postContent: content,
        postExcerpt: excerpt,
        postStatus: postStatus,
        postType: postType,
        commentStatus: commentStatus,
        pingStatus: pingStatus,
        postAuthor: fallbackAuthorId,
        postDate: isNaN(postDate.getTime()) ? new Date() : postDate,
        postDateGmt: isNaN(postDateGmt.getTime()) ? new Date() : postDateGmt,
        guid: guid,
      })
      .returning({ id: wpPosts.id });

    if (postType === "post") {
      postsImported++;
    } else {
      pagesImported++;
    }

    // 4. Attach Categories and Tags
    const itemCategories = ensureArray(item["category"]);
    for (const catNode of itemCategories) {
      const domain = catNode?.["@_domain"] || "category";
      const nicename = catNode?.["@_nicename"] || slugify(extractText(catNode));
      const catText = extractText(catNode);

      let termTaxId =
        termLookup.get(`${domain}:${nicename.toLowerCase()}`) ||
        termLookup.get(`${domain}:${catText.toLowerCase()}`);

      // Auto-create category if missing
      if (!termTaxId && catText && (domain === "category" || domain === "post_tag")) {
        const slug = nicename || slugify(catText);
        const [newTerm] = await db
          .insert(wpTerms)
          .values({
            name: catText,
            slug: slug,
          })
          .returning({ termId: wpTerms.termId });

        const [newTax] = await db
          .insert(wpTermTaxonomy)
          .values({
            termId: newTerm.termId,
            taxonomy: domain,
            description: "",
          })
          .returning({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId });

        termTaxId = newTax.termTaxonomyId;
        termLookup.set(`${domain}:${slug.toLowerCase()}`, termTaxId);
      }

      if (termTaxId) {
        await db
          .insert(wpTermRelationships)
          .values({
            objectId: insertedPost.id,
            termTaxonomyId: termTaxId,
            termOrder: 0,
          })
          .onConflictDoNothing();
      }
    }

    // 5. Post Comments (<wp:comment>)
    const itemComments = ensureArray(item["wp:comment"]);
    for (const com of itemComments) {
      const author = extractText(com["wp:comment_author"]);
      const email = extractText(com["wp:comment_author_email"]);
      const comContent = extractText(com["wp:comment_content"]);
      const approved = extractText(com["wp:comment_approved"]) || "1";
      const rawComDate = extractText(com["wp:comment_date"]);
      const comDate = rawComDate ? new Date(rawComDate) : new Date();

      if (comContent) {
        await db.insert(wpComments).values({
          commentPostId: insertedPost.id,
          commentAuthor: author || "Guest",
          commentAuthorEmail: email || "",
          commentContent: comContent,
          commentApproved: approved,
          commentDate: isNaN(comDate.getTime()) ? new Date() : comDate,
          commentDateGmt: isNaN(comDate.getTime()) ? new Date() : comDate,
        });
        commentsImported++;
      }
    }
  }

  return {
    success: true,
    postsImported,
    pagesImported,
    categoriesImported,
    tagsImported,
    commentsImported,
    skippedCount,
  };
}

/**
 * Imports content from a PressForge JSON archive
 */
export async function importJsonArchive(
  jsonContent: string,
  fallbackAuthorId: string
): Promise<ImportResult> {
  const archive = JSON.parse(jsonContent);

  if (!archive?.data || !Array.isArray(archive.data.posts)) {
    throw new Error("Invalid PressForge JSON archive: missing data.posts array.");
  }

  let postsImported = 0;
  let pagesImported = 0;
  let categoriesImported = 0;
  let tagsImported = 0;
  let commentsImported = 0;
  let skippedCount = 0;

  // Process terms
  if (Array.isArray(archive.data.terms) && Array.isArray(archive.data.taxonomies)) {
    for (const term of archive.data.terms) {
      const existing = await db
        .select({ termId: wpTerms.termId })
        .from(wpTerms)
        .where(eq(wpTerms.slug, term.slug))
        .limit(1);

      if (existing.length === 0) {
        const [newTerm] = await db
          .insert(wpTerms)
          .values({
            name: term.name,
            slug: term.slug,
          })
          .returning({ termId: wpTerms.termId });

        const tax = archive.data.taxonomies.find(
          (t: any) => String(t.termId) === String(term.termId)
        );

        if (tax) {
          await db.insert(wpTermTaxonomy).values({
            termId: newTerm.termId,
            taxonomy: tax.taxonomy,
            description: tax.description || "",
          });
          if (tax.taxonomy === "category") categoriesImported++;
          else if (tax.taxonomy === "post_tag") tagsImported++;
        }
      }
    }
  }

  // Process posts
  for (const post of archive.data.posts) {
    const existing = await db
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(and(eq(wpPosts.postName, post.postName), eq(wpPosts.postType, post.postType)))
      .limit(1);

    if (existing.length > 0) {
      skippedCount++;
      continue;
    }

    await db.insert(wpPosts).values({
      postTitle: post.postTitle || "Untitled",
      postName: post.postName,
      postContent: post.postContent || "",
      postExcerpt: post.postExcerpt || "",
      postStatus: post.postStatus || "publish",
      postType: post.postType || "post",
      postAuthor: fallbackAuthorId,
      postDate: post.postDate ? new Date(post.postDate) : new Date(),
      postDateGmt: post.postDateGmt ? new Date(post.postDateGmt) : new Date(),
    });

    if (post.postType === "page") pagesImported++;
    else postsImported++;
  }

  return {
    success: true,
    postsImported,
    pagesImported,
    categoriesImported,
    tagsImported,
    commentsImported,
    skippedCount,
  };
}
