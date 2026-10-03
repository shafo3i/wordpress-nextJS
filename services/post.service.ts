import { and, asc, count, desc, eq, gte, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { DB, db } from "@/db";
import {
  wpComments,
  wpPostmeta,
  wpPosts,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
  user,
} from "@/db/schema";
import { languagesTable, postTranslationsTable, termTranslationsTable } from "@/db/schema/cms-languages";
import {
  getPostLanguage,
  getPostTranslations,
  setPostLanguage,
  type LinkedPostTranslation,
} from "./language.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toBigInt(val: unknown): bigint {
  if (val === null || val === undefined || val === "") return BigInt(0);
  if (typeof val === "bigint") return val;
  if (typeof val === "number" || typeof val === "string") {
    try {
      return BigInt(val);
    } catch {
      return BigInt(0);
    }
  }
  return BigInt(0);
}

export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export async function uniquePostSlug(
  title: string,
  excludeId?: bigint | string | number,
  database: DB = db
): Promise<string> {
  const base = toSlug(title) || `post-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  const currentId = excludeId !== undefined ? toBigInt(excludeId) : undefined;

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
      .limit(1);

    if (!existing.length) return slug;
    slug = `${base}-${suffix++}`.slice(0, 200);
  }
}

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface PostTranslationLink {
  languageCode: string;
  postId: string;
  title: string;
}

export interface PostItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  date: string;
  authorName: string;
  categories: string[];
  categorySlugs: string[];
  tags: string[];
  commentCount: string;
  commentStatus: string;
  pingStatus: string;
  postPassword: string;
  featuredImageId?: string;
  languageCode?: string;
  translationGroupId?: string;
  translations?: PostTranslationLink[];
  seo?: PostSeoMeta;
}

export interface PostSeoMeta {
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
  seoNoindex?: boolean;
  seoCanonical?: string;
}

export interface GetPostsOptions {
  search?: string;
  status?: string;
  date?: "today" | "month";
  category?: string;
  language?: string;
  page?: number;
  pageSize?: number;
  orderBy?: "postModified" | "postDate" | "postTitle";
  order?: "asc" | "desc";
}

export interface PostCounts {
  all: number;
  publish: number;
  draft: number;
  pending: number;
  trash: number;
}

export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  termTaxonomyId?: string;
  languageCode?: string;
  translationGroupId?: string;
}

export interface TagOption {
  id: string;
  slug: string;
  name: string;
}

export interface CreatePostInput {
  title: string;
  content?: string;
  excerpt?: string;
  status?: string;
  commentStatus?: "open" | "closed";
  pingStatus?: "open" | "closed";
  postPassword?: string;
  postParent?: string | number;
  menuOrder?: number;
  featuredImageId?: string;
  categorySlugs?: string[];
  tags?: string[];
  languageCode?: string;
  translationOf?: string | number | bigint;
  authorId?: string;
  seo?: PostSeoMeta;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: string;
  commentStatus?: "open" | "closed";
  pingStatus?: "open" | "closed";
  postPassword?: string;
  postParent?: string | number;
  menuOrder?: number;
  featuredImageId?: string;
  categorySlugs?: string[];
  tags?: string[];
  languageCode?: string;
  translationOf?: string | number | bigint;
  seo?: PostSeoMeta;
}

// ---------------------------------------------------------------------------
// Term & Meta Helpers
// ---------------------------------------------------------------------------

async function syncFeaturedImage(
  postId: bigint,
  featuredImageId?: string,
  database: DB = db
) {
  await database
    .delete(wpPostmeta)
    .where(and(eq(wpPostmeta.postId, postId), eq(wpPostmeta.metaKey, "_thumbnail_id")));

  if (featuredImageId && /^\d+$/.test(featuredImageId.trim())) {
    await database.insert(wpPostmeta).values({
      postId,
      metaKey: "_thumbnail_id",
      metaValue: String(BigInt(featuredImageId.trim())),
    });
  }
}

export const SEO_META_KEYS = [
  "_seo_title",
  "_seo_description",
  "_seo_og_image",
  "_seo_noindex",
  "_seo_canonical",
] as const;

async function syncPostSeoMeta(
  postId: bigint,
  seo?: PostSeoMeta,
  database: DB = db
) {
  if (!seo) return;

  await database
    .delete(wpPostmeta)
    .where(
      and(
        eq(wpPostmeta.postId, postId),
        inArray(wpPostmeta.metaKey, [...SEO_META_KEYS])
      )
    );

  const metaToInsert: { postId: bigint; metaKey: string; metaValue: string }[] = [];

  if (seo.seoTitle !== undefined && seo.seoTitle.trim() !== "") {
    metaToInsert.push({ postId, metaKey: "_seo_title", metaValue: seo.seoTitle.trim() });
  }
  if (seo.seoDescription !== undefined && seo.seoDescription.trim() !== "") {
    metaToInsert.push({ postId, metaKey: "_seo_description", metaValue: seo.seoDescription.trim() });
  }
  if (seo.seoOgImage !== undefined && seo.seoOgImage.trim() !== "") {
    metaToInsert.push({ postId, metaKey: "_seo_og_image", metaValue: seo.seoOgImage.trim() });
  }
  if (seo.seoNoindex !== undefined) {
    metaToInsert.push({ postId, metaKey: "_seo_noindex", metaValue: seo.seoNoindex ? "1" : "0" });
  }
  if (seo.seoCanonical !== undefined && seo.seoCanonical.trim() !== "") {
    metaToInsert.push({ postId, metaKey: "_seo_canonical", metaValue: seo.seoCanonical.trim() });
  }

  if (metaToInsert.length > 0) {
    await database.insert(wpPostmeta).values(metaToInsert);
  }
}

async function syncPostTerms(
  postId: bigint,
  categorySlugs: string[] = [],
  tags: string[] = [],
  database: DB = db
) {
  await database.delete(wpTermRelationships).where(eq(wpTermRelationships.objectId, postId));

  const taxonomyIds: bigint[] = [];

  if (categorySlugs.length) {
    const categories = await database
      .select({ taxonomyId: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(and(eq(wpTermTaxonomy.taxonomy, "category"), inArray(wpTerms.slug, categorySlugs)));
    taxonomyIds.push(...categories.map((c) => c.taxonomyId));
  }

  for (const tagName of tags) {
    const cleanTag = tagName.trim();
    if (!cleanTag) continue;
    const slug = toSlug(cleanTag);
    const existing = await database
      .select({ termId: wpTerms.termId })
      .from(wpTerms)
      .where(eq(wpTerms.slug, slug))
      .limit(1);

    const termId =
      existing[0]?.termId ??
      (
        await database
          .insert(wpTerms)
          .values({ name: cleanTag, slug })
          .returning({ termId: wpTerms.termId })
      )[0].termId;

    const taxonomy = await database
      .select({ id: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .where(and(eq(wpTermTaxonomy.termId, termId), eq(wpTermTaxonomy.taxonomy, "post_tag")))
      .limit(1);

    const taxonomyId =
      taxonomy[0]?.id ??
      (
        await database
          .insert(wpTermTaxonomy)
          .values({ termId, taxonomy: "post_tag" })
          .returning({ id: wpTermTaxonomy.termTaxonomyId })
      )[0].id;

    taxonomyIds.push(taxonomyId);
  }

  if (taxonomyIds.length) {
    await database.insert(wpTermRelationships).values(
      taxonomyIds.map((termTaxonomyId) => ({
        objectId: postId,
        termTaxonomyId,
      }))
    );
  }
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

export async function getPosts(
  options: GetPostsOptions = {},
  database: DB = db
): Promise<{
  posts: PostItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}> {
  const {
    search,
    status,
    date,
    category,
    language,
    page = 1,
    pageSize = 20,
    orderBy = "postModified",
    order = "desc",
  } = options;

  const currentPage = Math.max(1, page);
  const conditions = [eq(wpPosts.postType, "post")];

  if (status && status !== "all") {
    conditions.push(eq(wpPosts.postStatus, status));
  } else if (!status || status === "all") {
    conditions.push(ne(wpPosts.postStatus, "trash"));
  }

  if (date === "today") {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    conditions.push(gte(wpPosts.postDate, today));
  } else if (date === "month") {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    conditions.push(gte(wpPosts.postDate, startOfMonth));
  }

  if (search && search.trim()) {
    conditions.push(ilike(wpPosts.postTitle, `%${search.trim()}%`));
  }

  // Filter by category
  if (category && category !== "all") {
    const catRows = await database
      .select({ taxonomyId: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(and(eq(wpTerms.slug, category), eq(wpTermTaxonomy.taxonomy, "category")))
      .limit(1);

    if (catRows[0]) {
      const relRows = await database
        .select({ objectId: wpTermRelationships.objectId })
        .from(wpTermRelationships)
        .where(eq(wpTermRelationships.termTaxonomyId, catRows[0].taxonomyId));

      const postIds = relRows.map((r) => r.objectId);
      if (postIds.length) {
        conditions.push(inArray(wpPosts.id, postIds));
      } else {
        conditions.push(eq(wpPosts.id, BigInt(-1)));
      }
    }
  }

  // Filter by language
  if (language && language !== "all") {
    const langPostRows = await database
      .select({ postId: postTranslationsTable.postId })
      .from(postTranslationsTable)
      .where(eq(postTranslationsTable.languageCode, language));

    const langPostIds = langPostRows.map((r) => r.postId);
    if (langPostIds.length) {
      conditions.push(inArray(wpPosts.id, langPostIds));
    } else {
      conditions.push(eq(wpPosts.id, BigInt(-1)));
    }
  }

  const whereClause = and(...conditions);

  const [totalRes] = await database
    .select({ total: count() })
    .from(wpPosts)
    .where(whereClause);

  const totalItems = Number(totalRes?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const sortColumn =
    orderBy === "postDate"
      ? wpPosts.postDate
      : orderBy === "postTitle"
      ? wpPosts.postTitle
      : wpPosts.postModified;

  const sortFn = order === "asc" ? asc : desc;

  const rows = await database
    .select({
      id: wpPosts.id,
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
    .orderBy(sortFn(sortColumn))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  if (!rows.length) {
    return { posts: [], totalItems, totalPages, currentPage };
  }

  const postIds = rows.map((r) => r.id);

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
      .innerJoin(wpTermTaxonomy, eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId))
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(inArray(wpTermRelationships.objectId, postIds)),
    database
      .select({ postId: wpPostmeta.postId, metaValue: wpPostmeta.metaValue })
      .from(wpPostmeta)
      .where(and(inArray(wpPostmeta.postId, postIds), eq(wpPostmeta.metaKey, "_thumbnail_id"))),
    database
      .select({
        postId: postTranslationsTable.postId,
        languageCode: postTranslationsTable.languageCode,
        translationGroupId: postTranslationsTable.translationGroupId,
      })
      .from(postTranslationsTable)
      .where(inArray(postTranslationsTable.postId, postIds)),
  ]);

  // Fetch sibling translations for translation groups
  const groupIds = Array.from(new Set(postTransRows.map((t) => t.translationGroupId).filter(Boolean)));
  let siblingTranslations: {
    groupId: string;
    postId: bigint;
    languageCode: string;
    title: string;
  }[] = [];

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
      .where(inArray(postTranslationsTable.translationGroupId, groupIds));
  }

  const posts: PostItem[] = rows.map((post) => {
    const comments = commentRows.find((c) => c.postId === post.id);
    const terms = termRows.filter((t) => t.objectId === post.id);
    const catTerms = terms.filter((t) => t.taxonomy === "category");
    const tagTerms = terms.filter((t) => t.taxonomy === "post_tag");
    const thumb = metaRows.find((m) => m.postId === post.id);
    const transInfo = postTransRows.find((t) => t.postId === post.id);

    let translations: PostTranslationLink[] | undefined;
    if (transInfo?.translationGroupId) {
      translations = siblingTranslations
        .filter((st) => st.groupId === transInfo.translationGroupId && st.postId !== post.id)
        .map((st) => ({
          languageCode: st.languageCode,
          postId: st.postId.toString(),
          title: st.title,
        }));
    }

    return {
      id: post.id.toString(),
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
      languageCode: transInfo?.languageCode,
      translationGroupId: transInfo?.translationGroupId,
      translations,
    };
  });

  return { posts, totalItems, totalPages, currentPage };
}

export async function getPostCounts(
  options: { language?: string } = {},
  database: DB = db
): Promise<PostCounts> {
  const { language } = options;

  let langPostIds: bigint[] | undefined;
  if (language && language !== "all") {
    const langRows = await database
      .select({ postId: postTranslationsTable.postId })
      .from(postTranslationsTable)
      .where(eq(postTranslationsTable.languageCode, language));
    langPostIds = langRows.map((r) => r.postId);
  }

  const buildCount = async (status?: string) => {
    const conditions = [eq(wpPosts.postType, "post")];
    if (status) {
      conditions.push(eq(wpPosts.postStatus, status));
    } else {
      conditions.push(ne(wpPosts.postStatus, "trash"));
    }
    if (langPostIds !== undefined) {
      if (langPostIds.length) {
        conditions.push(inArray(wpPosts.id, langPostIds));
      } else {
        return 0;
      }
    }
    const [res] = await database.select({ c: count() }).from(wpPosts).where(and(...conditions));
    return Number(res?.c ?? 0);
  };

  const [all, publish, draft, pending, trash] = await Promise.all([
    buildCount(undefined),
    buildCount("publish"),
    buildCount("draft"),
    buildCount("pending"),
    buildCount("trash"),
  ]);

  return { all, publish, draft, pending, trash };
}

export async function getPostById(
  id: bigint | string | number,
  database: DB = db
): Promise<{
  post: {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    status: string;
    commentStatus: string;
    pingStatus: string;
    postPassword: string;
    featuredImageId: string;
    categorySlugs: string[];
    tags: string[];
    languageCode?: string;
    translationGroupId?: string;
    seo: PostSeoMeta;
  };
  translations: LinkedPostTranslation[];
} | null> {
  const postId = toBigInt(id);
  if (postId <= BigInt(0)) return null;

  const [postRows, metaRows, termRows, langInfo, translations] = await Promise.all([
    database
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
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
      .select({ metaKey: wpPostmeta.metaKey, metaValue: wpPostmeta.metaValue })
      .from(wpPostmeta)
      .where(
        and(
          eq(wpPostmeta.postId, postId),
          inArray(wpPostmeta.metaKey, ["_thumbnail_id", ...SEO_META_KEYS])
        )
      ),
    database
      .select({
        taxonomy: wpTermTaxonomy.taxonomy,
        name: wpTerms.name,
        slug: wpTerms.slug,
      })
      .from(wpTermRelationships)
      .innerJoin(wpTermTaxonomy, eq(wpTermRelationships.termTaxonomyId, wpTermTaxonomy.termTaxonomyId))
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(eq(wpTermRelationships.objectId, postId)),
    getPostLanguage(postId, database),
    getPostTranslations(postId, database),
  ]);

  if (!postRows.length) return null;
  const p = postRows[0];
  const thumb = metaRows.find((m) => m.metaKey === "_thumbnail_id");
  const seoTitle = metaRows.find((m) => m.metaKey === "_seo_title")?.metaValue ?? undefined;
  const seoDescription = metaRows.find((m) => m.metaKey === "_seo_description")?.metaValue ?? undefined;
  const seoOgImage = metaRows.find((m) => m.metaKey === "_seo_og_image")?.metaValue ?? undefined;
  const seoNoindex = metaRows.find((m) => m.metaKey === "_seo_noindex")?.metaValue === "1";
  const seoCanonical = metaRows.find((m) => m.metaKey === "_seo_canonical")?.metaValue ?? undefined;

  const catSlugs = termRows.filter((t) => t.taxonomy === "category").map((t) => t.slug);
  const tagNames = termRows.filter((t) => t.taxonomy === "post_tag").map((t) => t.name);

  return {
    post: {
      id: p.id.toString(),
      title: p.title,
      content: p.content,
      excerpt: p.excerpt,
      slug: p.slug,
      status: p.status,
      commentStatus: p.commentStatus,
      pingStatus: p.pingStatus,
      postPassword: p.postPassword,
      featuredImageId: thumb?.metaValue ?? "",
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
  };
}

export async function getAllCategoriesOptions(
  language?: string,
  database: DB = db
): Promise<CategoryOption[]> {
  const conditions = [eq(wpTermTaxonomy.taxonomy, "category")];

  if (language && language !== "all") {
    const matching = await database
      .select({ termTaxonomyId: termTranslationsTable.termTaxonomyId })
      .from(termTranslationsTable)
      .where(eq(termTranslationsTable.languageCode, language));
    const taxIds = matching.map((m) => m.termTaxonomyId);
    if (taxIds.length > 0) {
      conditions.push(inArray(wpTermTaxonomy.termTaxonomyId, taxIds));
    } else {
      conditions.push(eq(wpTermTaxonomy.termTaxonomyId, BigInt(-1)));
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
    .orderBy(asc(wpTerms.name));

  return rows.map((r) => ({
    id: r.id.toString(),
    slug: r.slug,
    name: r.name,
    termTaxonomyId: r.termTaxonomyId.toString(),
    languageCode: r.languageCode ?? "en",
    translationGroupId: r.translationGroupId ?? undefined,
  }));
}

export async function getAllTagOptions(database: DB = db): Promise<TagOption[]> {
  const rows = await database
    .select({
      id: wpTerms.termId,
      slug: wpTerms.slug,
      name: wpTerms.name,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(eq(wpTermTaxonomy.taxonomy, "post_tag"))
    .orderBy(asc(wpTerms.name));

  return rows.map((r) => ({
    id: r.id.toString(),
    slug: r.slug,
    name: r.name,
  }));
}

export async function createPost(
  input: CreatePostInput,
  database: DB = db
): Promise<string> {
  const {
    title,
    content = "",
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
  } = input;

  const slug = await uniquePostSlug(title, undefined, database);
  const now = new Date();
  const generatedExcerpt =
    excerpt ||
    content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) ||
    "";

  const inserted = await database
    .insert(wpPosts)
    .values({
      postAuthor: authorId ?? null,
      postDate: now,
      postDateGmt: now,
      postContent: content,
      postTitle: title,
      postExcerpt: generatedExcerpt,
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
      postParent: toBigInt(postParent),
      guid: `/posts/${slug}`,
      menuOrder,
      postType: "post",
      postMimeType: "",
      commentCount: BigInt(0),
    })
    .returning({ id: wpPosts.id });

  const newId = inserted[0].id;

  await syncFeaturedImage(newId, featuredImageId, database);
  await syncPostTerms(newId, categorySlugs, tags, database);

  if (input.seo) {
    await syncPostSeoMeta(newId, input.seo, database);
  }

  const sourcePostId = translationOf ? toBigInt(translationOf) : undefined;
  await setPostLanguage(newId, languageCode, sourcePostId, database);

  return newId.toString();
}

export async function updatePost(
  id: bigint | string | number,
  input: UpdatePostInput,
  database: DB = db
): Promise<void> {
  const postId = toBigInt(id);
  if (postId <= BigInt(0)) throw new Error("A valid post ID is required");

  const existing = await database
    .select({ id: wpPosts.id, postTitle: wpPosts.postTitle })
    .from(wpPosts)
    .where(and(eq(wpPosts.id, postId), eq(wpPosts.postType, "post")))
    .limit(1);

  if (!existing.length) throw new Error("Post not found");

  const updates: Partial<typeof wpPosts.$inferInsert> = {
    postModified: new Date(),
    postModifiedGmt: new Date(),
  };

  if (input.title !== undefined) {
    updates.postTitle = input.title;
    const slug = input.slug?.trim()
      ? await uniquePostSlug(input.slug, postId, database)
      : await uniquePostSlug(input.title, postId, database);
    updates.postName = slug;
    updates.guid = `/posts/${slug}`;
  }

  if (input.content !== undefined) updates.postContent = input.content;
  if (input.excerpt !== undefined) {
    updates.postExcerpt = input.excerpt;
  } else if (input.content !== undefined && updates.postContent) {
    updates.postExcerpt = updates.postContent
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);
  }

  if (input.status !== undefined) updates.postStatus = input.status;
  if (input.commentStatus !== undefined) updates.commentStatus = input.commentStatus;
  if (input.pingStatus !== undefined) updates.pingStatus = input.pingStatus;
  if (input.postPassword !== undefined) updates.postPassword = input.postPassword;
  if (input.postParent !== undefined) updates.postParent = toBigInt(input.postParent);
  if (input.menuOrder !== undefined) updates.menuOrder = input.menuOrder;

  await database
    .update(wpPosts)
    .set(updates)
    .where(and(eq(wpPosts.id, postId), eq(wpPosts.postType, "post")));

  if (input.featuredImageId !== undefined) {
    await syncFeaturedImage(postId, input.featuredImageId, database);
  }

  if (input.categorySlugs !== undefined || input.tags !== undefined) {
    await syncPostTerms(postId, input.categorySlugs, input.tags, database);
  }

  if (input.seo !== undefined) {
    await syncPostSeoMeta(postId, input.seo, database);
  }

  if (input.languageCode) {
    const sourcePostId = input.translationOf ? toBigInt(input.translationOf) : undefined;
    await setPostLanguage(postId, input.languageCode, sourcePostId, database);
  }
}

export async function trashPosts(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  const bigIds = ids.map(toBigInt).filter((i) => i > BigInt(0));
  if (!bigIds.length) return;

  await database
    .update(wpPosts)
    .set({ postStatus: "trash", postModified: new Date(), postModifiedGmt: new Date() })
    .where(and(inArray(wpPosts.id, bigIds), eq(wpPosts.postType, "post")));
}

export async function restorePosts(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  const bigIds = ids.map(toBigInt).filter((i) => i > BigInt(0));
  if (!bigIds.length) return;

  await database
    .update(wpPosts)
    .set({ postStatus: "draft", postModified: new Date(), postModifiedGmt: new Date() })
    .where(and(inArray(wpPosts.id, bigIds), eq(wpPosts.postType, "post")));
}

export async function deletePosts(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  const bigIds = ids.map(toBigInt).filter((i) => i > BigInt(0));
  if (!bigIds.length) return;

  await database.transaction(async (tx) => {
    await tx.delete(wpPostmeta).where(inArray(wpPostmeta.postId, bigIds));
    await tx.delete(wpTermRelationships).where(inArray(wpTermRelationships.objectId, bigIds));
    await tx.delete(postTranslationsTable).where(inArray(postTranslationsTable.postId, bigIds));
    await tx.delete(wpPosts).where(and(inArray(wpPosts.id, bigIds), eq(wpPosts.postType, "post")));
  });
}
