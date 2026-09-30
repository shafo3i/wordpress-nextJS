import { and, asc, count, desc, eq, gte, ilike, inArray, ne, sql } from "drizzle-orm";
import { DB, db } from "@/db";
import { wpComments, wpPostmeta, wpPosts, user } from "@/db/schema";
import { languagesTable, postTranslationsTable } from "@/db/schema/cms-languages";
import {
  getDefaultLanguage,
  getPostLanguage,
  getPostTranslations,
  linkPostTranslation,
  setPostLanguage,
  type LinkedPostTranslation,
} from "./language.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toBigInt(val: unknown): bigint {
  if (val === null || val === undefined || val === "") return BigInt(0);
  if (typeof val === "bigint") return val;
  if (typeof val === "number" || typeof val === "string") return BigInt(val);
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

export async function uniquePageSlug(
  title: string,
  excludeId?: bigint | string | number,
  database: DB = db
): Promise<string> {
  const base = toSlug(title) || `page-${Date.now()}`;
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
          eq(wpPosts.postType, "page"),
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

export interface PageTranslationLink {
  languageCode: string;
  postId: string;
  title: string;
}

export interface PageItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  date: string;
  authorName: string;
  commentCount: string;
  postParent: string;
  menuOrder: number;
  commentStatus: string;
  postPassword: string;
  languageCode?: string;
  translationGroupId?: string;
  translations?: PageTranslationLink[];
}

export interface GetPagesOptions {
  search?: string;
  status?: string;
  date?: "today" | "month";
  language?: string;
  page?: number;
  pageSize?: number;
  orderBy?: "menuOrder" | "postModified" | "postDate" | "postTitle";
  order?: "asc" | "desc";
}

export interface PageCounts {
  all: number;
  publish: number;
  draft: number;
  pending: number;
  trash: number;
}

export interface CreatePageInput {
  title: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: string;
  commentStatus?: "open" | "closed";
  pingStatus?: "open" | "closed";
  postPassword?: string;
  postParent?: string | number;
  menuOrder?: number;
  template?: string;
  featuredImageId?: string;
  languageCode?: string;
  translationOf?: string | number;
  userId?: string;
}

export interface UpdatePageInput {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: string;
  commentStatus?: "open" | "closed";
  pingStatus?: "open" | "closed";
  postPassword?: string;
  postParent?: string | number;
  menuOrder?: number;
  template?: string;
  featuredImageId?: string;
  languageCode?: string;
  translationOf?: string | number;
}

export interface QuickUpdatePageInput {
  id: string;
  title: string;
  slug?: string;
  date?: string;
  status?: string;
  postParent?: string | number;
  menuOrder?: number;
  commentStatus?: "open" | "closed";
  postPassword?: string;
}

// ---------------------------------------------------------------------------
// Query Services
// ---------------------------------------------------------------------------

export async function getPages(
  options: GetPagesOptions = {},
  database: DB = db
): Promise<{ pages: PageItem[]; totalItems: number; totalPages: number }> {
  const {
    search,
    status,
    date,
    language,
    page = 1,
    pageSize = 20,
    orderBy = "menuOrder",
    order = "desc",
  } = options;

  const currentPage = Math.max(1, page);
  const baseFilter = eq(wpPosts.postType, "page");

  let dateStart: Date | undefined;
  if (date === "today") {
    dateStart = new Date(new Date().setHours(0, 0, 0, 0));
  } else if (date === "month") {
    dateStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }

  // Filter conditions
  const filterArgs = [
    baseFilter,
    status ? eq(wpPosts.postStatus, status) : undefined,
    dateStart ? gte(wpPosts.postDate, dateStart) : undefined,
    search ? ilike(wpPosts.postTitle, `%${search}%`) : undefined,
  ];

  // If filtered by language
  let pageIdsInLanguage: bigint[] | undefined;
  if (language && language !== "all") {
    const transRows = await database
      .select({ postId: postTranslationsTable.postId })
      .from(postTranslationsTable)
      .where(eq(postTranslationsTable.languageCode, language));

    pageIdsInLanguage = transRows.map((r) => r.postId);
    if (pageIdsInLanguage.length > 0) {
      filterArgs.push(inArray(wpPosts.id, pageIdsInLanguage));
    } else {
      filterArgs.push(eq(wpPosts.id, BigInt(-1)));
    }
  }

  // Order clause
  let orderClause = desc(wpPosts.menuOrder);
  if (orderBy === "postModified") {
    orderClause = order === "asc" ? asc(wpPosts.postModified) : desc(wpPosts.postModified);
  } else if (orderBy === "postDate") {
    orderClause = order === "asc" ? asc(wpPosts.postDate) : desc(wpPosts.postDate);
  } else if (orderBy === "postTitle") {
    orderClause = order === "asc" ? asc(wpPosts.postTitle) : desc(wpPosts.postTitle);
  } else {
    orderClause = order === "asc" ? asc(wpPosts.menuOrder) : desc(wpPosts.menuOrder);
  }

  const [totalRes, rows] = await Promise.all([
    database
      .select({ total: count() })
      .from(wpPosts)
      .where(and(...filterArgs)),
    database
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        status: wpPosts.postStatus,
        date: wpPosts.postDate,
        slug: wpPosts.postName,
        postParent: wpPosts.postParent,
        menuOrder: wpPosts.menuOrder,
        commentStatus: wpPosts.commentStatus,
        postPassword: wpPosts.postPassword,
        authorName: user.name,
      })
      .from(wpPosts)
      .leftJoin(user, eq(wpPosts.postAuthor, user.id))
      .where(and(...filterArgs))
      .orderBy(orderClause, desc(wpPosts.postModified))
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize),
  ]);

  const totalItems = Number(totalRes[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageIds = rows.map((r) => r.id);

  if (pageIds.length === 0) {
    return { pages: [], totalItems, totalPages };
  }

  // Comments count
  const commentRows = await database
    .select({ postId: wpComments.commentPostId, count: count() })
    .from(wpComments)
    .where(inArray(wpComments.commentPostId, pageIds))
    .groupBy(wpComments.commentPostId);

  // Translation mapping for these pages
  const postTransRows = await database
    .select({
      postId: postTranslationsTable.postId,
      languageCode: postTranslationsTable.languageCode,
      translationGroupId: postTranslationsTable.translationGroupId,
    })
    .from(postTranslationsTable)
    .where(inArray(postTranslationsTable.postId, pageIds));

  // Find all translations belonging to the same translation groups
  const groupIds = Array.from(new Set(postTransRows.map((t) => t.translationGroupId).filter(Boolean)));
  let siblingTranslations: {
    groupId: string;
    postId: bigint;
    languageCode: string;
    title: string;
  }[] = [];

  if (groupIds.length > 0) {
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

  const pages: PageItem[] = rows.map((pageItem) => {
    const comment = commentRows.find((c) => c.postId === pageItem.id);
    const transInfo = postTransRows.find((t) => t.postId === pageItem.id);

    const relatedTranslations: PageTranslationLink[] = [];
    if (transInfo?.translationGroupId) {
      siblingTranslations
        .filter((st) => st.groupId === transInfo.translationGroupId && st.postId !== pageItem.id)
        .forEach((st) => {
          relatedTranslations.push({
            languageCode: st.languageCode,
            postId: st.postId.toString(),
            title: st.title,
          });
        });
    }

    return {
      id: pageItem.id.toString(),
      title: pageItem.title,
      slug: pageItem.slug,
      status: pageItem.status,
      date: pageItem.date.toISOString(),
      authorName: pageItem.authorName ?? "admin",
      commentCount: String(comment?.count ?? 0),
      postParent: pageItem.postParent?.toString() || "0",
      menuOrder: pageItem.menuOrder,
      commentStatus: pageItem.commentStatus,
      postPassword: pageItem.postPassword,
      languageCode: transInfo?.languageCode,
      translationGroupId: transInfo?.translationGroupId,
      translations: relatedTranslations,
    };
  });

  return { pages, totalItems, totalPages };
}

export async function getPageCounts(
  options: { language?: string } = {},
  database: DB = db
): Promise<PageCounts> {
  const { language } = options;
  const baseFilter = eq(wpPosts.postType, "page");
  const filterArgs = [baseFilter];

  if (language && language !== "all") {
    const transRows = await database
      .select({ postId: postTranslationsTable.postId })
      .from(postTranslationsTable)
      .where(eq(postTranslationsTable.languageCode, language));

    const ids = transRows.map((r) => r.postId);
    if (ids.length > 0) {
      filterArgs.push(inArray(wpPosts.id, ids));
    } else {
      filterArgs.push(eq(wpPosts.id, BigInt(-1)));
    }
  }

  const [allRes, pubRes, draftRes, pendingRes, trashRes] = await Promise.all([
    database.select({ count: count() }).from(wpPosts).where(and(...filterArgs)),
    database.select({ count: count() }).from(wpPosts).where(and(...filterArgs, eq(wpPosts.postStatus, "publish"))),
    database.select({ count: count() }).from(wpPosts).where(and(...filterArgs, eq(wpPosts.postStatus, "draft"))),
    database.select({ count: count() }).from(wpPosts).where(and(...filterArgs, eq(wpPosts.postStatus, "pending"))),
    database.select({ count: count() }).from(wpPosts).where(and(...filterArgs, eq(wpPosts.postStatus, "trash"))),
  ]);

  return {
    all: Number(allRes[0]?.count ?? 0),
    publish: Number(pubRes[0]?.count ?? 0),
    draft: Number(draftRes[0]?.count ?? 0),
    pending: Number(pendingRes[0]?.count ?? 0),
    trash: Number(trashRes[0]?.count ?? 0),
  };
}

export async function getPageById(
  id: bigint | string | number,
  database: DB = db
): Promise<{
  page: {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    slug: string;
    status: string;
    postParent: string;
    menuOrder: number;
    commentStatus: string;
    postPassword: string;
    template?: string;
    featuredImageId: string;
    languageCode?: string;
    translationGroupId?: string;
  };
  translations: LinkedPostTranslation[];
} | null> {
  const pageId = toBigInt(id);
  if (pageId <= BigInt(0)) return null;

  const [pageRows, metaRows, langInfo, translations] = await Promise.all([
    database
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        content: wpPosts.postContent,
        excerpt: wpPosts.postExcerpt,
        slug: wpPosts.postName,
        status: wpPosts.postStatus,
        postParent: wpPosts.postParent,
        menuOrder: wpPosts.menuOrder,
        commentStatus: wpPosts.commentStatus,
        postPassword: wpPosts.postPassword,
      })
      .from(wpPosts)
      .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")))
      .limit(1),
    database
      .select({ metaKey: wpPostmeta.metaKey, metaValue: wpPostmeta.metaValue })
      .from(wpPostmeta)
      .where(
        and(
          eq(wpPostmeta.postId, pageId),
          inArray(wpPostmeta.metaKey, ["_thumbnail_id", "_wp_page_template"])
        )
      ),
    getPostLanguage(pageId, database),
    getPostTranslations(pageId, database),
  ]);

  if (!pageRows.length) return null;
  const p = pageRows[0];
  const thumbRow = metaRows.find((m) => m.metaKey === "_thumbnail_id");
  const templateRow = metaRows.find((m) => m.metaKey === "_wp_page_template");

  return {
    page: {
      id: p.id.toString(),
      title: p.title,
      content: p.content,
      excerpt: p.excerpt,
      slug: p.slug,
      status: p.status,
      postParent: p.postParent?.toString() || "0",
      menuOrder: p.menuOrder,
      commentStatus: p.commentStatus,
      postPassword: p.postPassword,
      template: templateRow?.metaValue || "default",
      featuredImageId: thumbRow?.metaValue || "",
      languageCode: langInfo?.languageCode,
      translationGroupId: langInfo?.translationGroupId,
    },
    translations,
  };
}

export async function getAllParentPageOptions(
  excludeId?: bigint | string | number,
  language?: string,
  database: DB = db
): Promise<{ id: string; title: string }[]> {
  const exId = excludeId !== undefined ? toBigInt(excludeId) : undefined;
  const filterArgs = [
    eq(wpPosts.postType, "page"),
    exId ? ne(wpPosts.id, exId) : undefined,
  ];

  if (language && language !== "all") {
    const transRows = await database
      .select({ postId: postTranslationsTable.postId })
      .from(postTranslationsTable)
      .where(eq(postTranslationsTable.languageCode, language));

    const ids = transRows.map((r) => r.postId);
    if (ids.length > 0) {
      filterArgs.push(inArray(wpPosts.id, ids));
    }
  }

  const rows = await database
    .select({ id: wpPosts.id, title: wpPosts.postTitle })
    .from(wpPosts)
    .where(and(...filterArgs))
    .orderBy(asc(wpPosts.postTitle));

  return rows.map((p) => ({
    id: p.id.toString(),
    title: p.title || `Page #${p.id}`,
  }));
}

// ---------------------------------------------------------------------------
// Mutation Services
// ---------------------------------------------------------------------------

export async function createPage(
  input: CreatePageInput,
  database: DB = db
): Promise<string> {
  const title = (input.title || "").trim();
  if (!title) {
    throw new Error("Page title is required.");
  }

  const slug = await uniquePageSlug(input.slug || title, undefined, database);
  const now = new Date();
  const content = input.content || "";
  const excerpt =
    input.excerpt ||
    content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) ||
    "";

  const parentId = input.postParent ? toBigInt(input.postParent) : BigInt(0);
  const menuOrder = Number(input.menuOrder ?? 0) || 0;
  const status = input.status || "publish";

  const [inserted] = await database
    .insert(wpPosts)
    .values({
      postAuthor: input.userId || null,
      postDate: now,
      postDateGmt: now,
      postContent: content,
      postTitle: title,
      postExcerpt: excerpt,
      postStatus: status,
      commentStatus: input.commentStatus || "closed",
      pingStatus: input.pingStatus || "closed",
      postPassword: input.postPassword || "",
      postName: slug,
      toPing: "",
      pinged: "",
      postModified: now,
      postModifiedGmt: now,
      postContentFiltered: "",
      postParent: parentId,
      guid: `/${slug}`,
      menuOrder,
      postType: "page",
      postMimeType: "",
      commentCount: BigInt(0),
    })
    .returning({ id: wpPosts.id });

  const newId = inserted.id;

  // Featured image
  if (input.featuredImageId) {
    await database.insert(wpPostmeta).values({
      postId: newId,
      metaKey: "_thumbnail_id",
      metaValue: String(input.featuredImageId),
    });
  }

  // Page Template
  if (input.template) {
    await database.insert(wpPostmeta).values({
      postId: newId,
      metaKey: "_wp_page_template",
      metaValue: input.template,
    });
  }

  // Language & Translation
  let langCode = input.languageCode;
  if (!langCode || langCode === "all") {
    const defaultLang = await getDefaultLanguage(database);
    langCode = defaultLang?.code || "en";
  }

  const sourcePostId = input.translationOf ? toBigInt(input.translationOf) : undefined;
  await setPostLanguage(newId, langCode, sourcePostId, database);

  return newId.toString();
}

export async function updatePage(
  id: bigint | string | number,
  input: UpdatePageInput,
  database: DB = db
): Promise<void> {
  const pageId = toBigInt(id);
  if (pageId <= BigInt(0)) {
    throw new Error("Valid page ID is required.");
  }

  const title = (input.title || "").trim();
  if (!title) {
    throw new Error("Page title is required.");
  }

  const slug = await uniquePageSlug(input.slug || title, pageId, database);
  const now = new Date();
  const content = input.content || "";
  const excerpt =
    input.excerpt ||
    content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) ||
    "";

  const parentId = input.postParent !== undefined ? toBigInt(input.postParent) : undefined;
  const menuOrder = input.menuOrder !== undefined ? Number(input.menuOrder) : undefined;

  const updateFields: Record<string, unknown> = {
    postTitle: title,
    postContent: content,
    postExcerpt: excerpt,
    postName: slug,
    guid: `/${slug}`,
    postModified: now,
    postModifiedGmt: now,
  };

  if (input.status) updateFields.postStatus = input.status;
  if (input.commentStatus) updateFields.commentStatus = input.commentStatus;
  if (input.pingStatus) updateFields.pingStatus = input.pingStatus;
  if (input.postPassword !== undefined) updateFields.postPassword = input.postPassword;
  if (parentId !== undefined) updateFields.postParent = parentId;
  if (menuOrder !== undefined) updateFields.menuOrder = menuOrder;

  await database
    .update(wpPosts)
    .set(updateFields)
    .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")));

  // Featured Image
  if (input.featuredImageId !== undefined) {
    await database
      .delete(wpPostmeta)
      .where(and(eq(wpPostmeta.postId, pageId), eq(wpPostmeta.metaKey, "_thumbnail_id")));

    if (input.featuredImageId) {
      await database.insert(wpPostmeta).values({
        postId: pageId,
        metaKey: "_thumbnail_id",
        metaValue: String(input.featuredImageId),
      });
    }
  }

  // Page Template
  if (input.template !== undefined) {
    await database
      .delete(wpPostmeta)
      .where(and(eq(wpPostmeta.postId, pageId), eq(wpPostmeta.metaKey, "_wp_page_template")));

    if (input.template) {
      await database.insert(wpPostmeta).values({
        postId: pageId,
        metaKey: "_wp_page_template",
        metaValue: input.template,
      });
    }
  }

  // Language
  if (input.languageCode) {
    const sourcePostId = input.translationOf ? toBigInt(input.translationOf) : undefined;
    await setPostLanguage(pageId, input.languageCode, sourcePostId, database);
  }
}

export async function quickUpdatePage(
  input: QuickUpdatePageInput,
  database: DB = db
): Promise<{ id: string; title: string; slug: string; status: string; date: string }> {
  const pageId = toBigInt(input.id);
  if (pageId <= BigInt(0)) {
    throw new Error("Valid page ID is required.");
  }

  const title = (input.title || "").trim();
  if (!title) {
    throw new Error("Page title is required.");
  }

  const slug = await uniquePageSlug(input.slug || title, pageId, database);
  const now = new Date();

  const updateFields: Record<string, unknown> = {
    postTitle: title,
    postName: slug,
    postModified: now,
    postModifiedGmt: now,
  };

  if (input.status) updateFields.postStatus = input.status;
  if (input.commentStatus) updateFields.commentStatus = input.commentStatus;
  if (input.postPassword !== undefined) updateFields.postPassword = input.postPassword;
  if (input.postParent !== undefined) updateFields.postParent = toBigInt(input.postParent);
  if (input.menuOrder !== undefined) updateFields.menuOrder = Number(input.menuOrder) || 0;

  if (input.date) {
    const parsedDate = new Date(input.date);
    if (!Number.isNaN(parsedDate.getTime())) {
      updateFields.postDate = parsedDate;
      updateFields.postDateGmt = parsedDate;
    }
  }

  await database
    .update(wpPosts)
    .set(updateFields)
    .where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")));

  return {
    id: input.id,
    title,
    slug,
    status: input.status || "publish",
    date: (updateFields.postDate as Date | undefined)?.toISOString() || now.toISOString(),
  };
}

export async function trashPages(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  const bigIds = ids.map(toBigInt).filter((id) => id > BigInt(0));
  if (!bigIds.length) return;

  await database
    .update(wpPosts)
    .set({ postStatus: "trash", postModified: new Date() })
    .where(and(inArray(wpPosts.id, bigIds), eq(wpPosts.postType, "page")));
}

export async function restorePages(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  const bigIds = ids.map(toBigInt).filter((id) => id > BigInt(0));
  if (!bigIds.length) return;

  await database
    .update(wpPosts)
    .set({ postStatus: "draft", postModified: new Date() })
    .where(and(inArray(wpPosts.id, bigIds), eq(wpPosts.postType, "page")));
}

export async function deletePages(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<void> {
  const bigIds = ids.map(toBigInt).filter((id) => id > BigInt(0));
  if (!bigIds.length) return;

  await database.transaction(async (tx) => {
    // Delete meta
    await tx.delete(wpPostmeta).where(inArray(wpPostmeta.postId, bigIds));
    // Delete translations
    await tx.delete(postTranslationsTable).where(inArray(postTranslationsTable.postId, bigIds));
    // Delete comments
    await tx.delete(wpComments).where(inArray(wpComments.commentPostId, bigIds));
    // Delete pages
    await tx.delete(wpPosts).where(and(inArray(wpPosts.id, bigIds), eq(wpPosts.postType, "page")));
  });
}
