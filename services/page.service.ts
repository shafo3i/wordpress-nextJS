import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
import { createPageSchema, updatePageSchema, quickUpdatePageSchema, pageIdSchema, pageIdsSchema, pageQuerySchema } from "@/db/schema/cms-pages";
import { renderPostMedia } from "@/lib/post-content-media";
import { contentPlainText } from "@/lib/content-text";
import { and, asc, count, desc, eq, gte, ilike, inArray, ne, sql } from "drizzle-orm";
import { DB, db } from "@/db";
import { wpComments, wpPostmeta, wpPosts, user } from "@/db/schema";
import { languagesTable, postTranslationsTable } from "@/db/schema/cms-languages";
import {
  getDefaultLanguage,
  getPostLanguage,
  setPostLanguage,
  type LinkedPostTranslation,
} from "./language.service";
import { getOption } from "./settings.service";
import { parseStudioDocument } from "@/lib/studio/tree-helpers";
import type { StudioDocumentData } from "@/lib/studio/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toBigInt(val: unknown): bigint {
  return pageIdSchema.parse(val);
}

export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export async function uniquePageSlug(
  title: string,
  excludeId?: bigint | string | number,
  database: DB = db
): Promise<string> {
  await verifyAdmin();
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
    const tail = `-${suffix++}`;
    slug = `${base.slice(0, 200 - tail.length)}${tail}`;
    if (suffix > 10000) throw new PageMutationError("invalid");
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
  isStudioBuilder?: boolean;
  isFrontPage?: boolean;
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
  await verifyAdmin();
  const {
    search,
    status,
    date,
    language,
    page = 1,
    pageSize = 20,
    orderBy = "menuOrder",
    order = "desc",
  } = pageQuerySchema.parse(options);

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
        pingStatus: wpPosts.pingStatus,
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
  const [commentRows, studioMetaRows, showOnFront, pageOnFront] = await Promise.all([
    database
      .select({ postId: wpComments.commentPostId, count: count() })
      .from(wpComments)
      .where(inArray(wpComments.commentPostId, pageIds))
      .groupBy(wpComments.commentPostId),
    database
      .select({ postId: wpPostmeta.postId, metaValue: wpPostmeta.metaValue })
      .from(wpPostmeta)
      .where(
        and(
          inArray(wpPostmeta.postId, pageIds),
          eq(wpPostmeta.metaKey, "_studio_edit_mode")
        )
      ),
    getOption("show_on_front", "posts", database),
    getOption("page_on_front", "", database),
  ]);

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
    const studioMeta = studioMetaRows.find((m) => m.postId === pageItem.id);

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

    const idStr = pageItem.id.toString();

    return {
      id: idStr,
      title: pageItem.title,
      slug: pageItem.slug,
      status: pageItem.status,
      date: pageItem.date.toISOString(),
      authorName: pageItem.authorName ?? "",
      commentCount: String(comment?.count ?? 0),
      postParent: pageItem.postParent?.toString() || "0",
      menuOrder: pageItem.menuOrder,
      commentStatus: pageItem.commentStatus,
      postPassword: pageItem.postPassword,
      languageCode: transInfo?.languageCode,
      translationGroupId: transInfo?.translationGroupId,
      translations: relatedTranslations,
      isStudioBuilder: studioMeta?.metaValue === "builder",
      isFrontPage: showOnFront === "page" && pageOnFront === idStr,
    };
  });

  return { pages, totalItems, totalPages };
}

export async function getPageCounts(
  options: { language?: string } = {},
  database: DB = db
): Promise<PageCounts> {
  await verifyAdmin();
  const { language } = pageQuerySchema.parse(options);
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

async function getAdminPageTranslations(id: bigint, database: DB): Promise<LinkedPostTranslation[]> {
  const language = await getPostLanguage(id, database);
  if (!language) return [];
  return database.select({ postId: wpPosts.id, slug: wpPosts.postName, title: wpPosts.postTitle,
    languageCode: languagesTable.code, languageName: languagesTable.name, nativeName: languagesTable.nativeName,
    direction: languagesTable.direction, isDefault: languagesTable.isDefault })
    .from(postTranslationsTable).innerJoin(wpPosts, eq(postTranslationsTable.postId, wpPosts.id))
    .innerJoin(languagesTable, eq(postTranslationsTable.languageCode, languagesTable.code))
    .where(and(eq(postTranslationsTable.translationGroupId, language.translationGroupId), eq(wpPosts.postType, "page"), ne(wpPosts.postStatus, "trash"), eq(languagesTable.isActive, true)));
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
    pingStatus: string;
    postPassword: string;
    template?: string;
    featuredImageId: string;
    languageCode?: string;
    translationGroupId?: string;
    isStudioBuilder: boolean;
    studioData: StudioDocumentData;
    isFrontPage: boolean;
  };
  translations: LinkedPostTranslation[];
} | null> {
  await verifyAdmin();
  const parsedId = pageIdSchema.safeParse(id);
  if (!parsedId.success) return null;
  const pageId = parsedId.data;

  const [pageRows, metaRows, langInfo, translations, showOnFront, pageOnFront] = await Promise.all([
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
        pingStatus: wpPosts.pingStatus,
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
          inArray(wpPostmeta.metaKey, [
            "_thumbnail_id",
            "_wp_page_template",
            "_studio_edit_mode",
            "_studio_data",
          ])
        )
      ),
    getPostLanguage(pageId, database),
    getAdminPageTranslations(pageId, database),
    getOption("show_on_front", "posts", database),
    getOption("page_on_front", "", database),
  ]);

  if (!pageRows.length) return null;
  const p = pageRows[0];
  const thumbRow = metaRows.find((m) => m.metaKey === "_thumbnail_id");
  const templateRow = metaRows.find((m) => m.metaKey === "_wp_page_template");
  const studioModeRow = metaRows.find((m) => m.metaKey === "_studio_edit_mode");
  const studioDataRow = metaRows.find((m) => m.metaKey === "_studio_data");

  const idStr = p.id.toString();

  return {
    page: {
      id: idStr,
      title: p.title,
      content: renderPostMedia(p.content),
      excerpt: p.excerpt,
      slug: p.slug,
      status: p.status,
      postParent: p.postParent?.toString() || "0",
      menuOrder: p.menuOrder,
      commentStatus: p.commentStatus,
      pingStatus: p.pingStatus,
      postPassword: p.postPassword,
      template: templateRow?.metaValue || "default",
      featuredImageId: thumbRow?.metaValue || "",
      languageCode: langInfo?.languageCode,
      translationGroupId: langInfo?.translationGroupId,
      isStudioBuilder: studioModeRow?.metaValue === "builder",
      studioData: parseStudioDocument(studioDataRow?.metaValue),
      isFrontPage: showOnFront === "page" && pageOnFront === idStr,
    },
    translations,
  };
}

export async function getAllParentPageOptions(
  excludeId?: bigint | string | number,
  language?: string,
  database: DB = db
): Promise<{ id: string; title: string }[]> {
  await verifyAdmin();
  language = pageQuerySchema.parse({ language }).language;
  const exId = excludeId !== undefined ? toBigInt(excludeId) : undefined;
  const filterArgs = [
    eq(wpPosts.postType, "page"),
    ne(wpPosts.postStatus, "trash"),
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
    } else {
      return [];
    }
  }

  const rows = await database
    .select({ id: wpPosts.id, title: wpPosts.postTitle })
    .from(wpPosts)
    .where(and(...filterArgs))
    .orderBy(asc(wpPosts.postTitle));

  return rows.map((p) => ({
    id: p.id.toString(),
    title: p.title,
  }));
}

// ---------------------------------------------------------------------------
// Mutation Services
// ---------------------------------------------------------------------------

export class PageMutationError extends Error {
  constructor(readonly key: "invalid" | "missing" | "parent" | "image" | "homepage") { super(key); }
}

async function lockedPages(database: DB, ids: bigint[]) {
  const rows = await database.select({ id: wpPosts.id, parent: wpPosts.postParent, status: wpPosts.postStatus, slug: wpPosts.postName, date: wpPosts.postDate })
    .from(wpPosts).where(and(inArray(wpPosts.id, ids), eq(wpPosts.postType, "page"))).for("update");
  if (rows.length !== ids.length) throw new PageMutationError("missing");
  return rows;
}
async function lockPages(database: DB) {
  await database.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:pages'))`);
}
async function validatePageLinks(input: Partial<ReturnType<typeof createPageSchema.parse>>, id: bigint | undefined, database: DB) {
  if (input.featuredImageId) {
    const [image] = await database.select({ id: wpPosts.id }).from(wpPosts).where(and(eq(wpPosts.id, BigInt(input.featuredImageId)), eq(wpPosts.postType, "attachment"), ilike(wpPosts.postMimeType, "image/%"))).limit(1);
    if (!image) throw new PageMutationError("image");
  }
  if (input.translationOf) {
    if (BigInt(input.translationOf) === id) throw new PageMutationError("invalid");
    const [source] = await database.select({ id: wpPosts.id }).from(wpPosts).where(and(eq(wpPosts.id, BigInt(input.translationOf)), eq(wpPosts.postType, "page"), ne(wpPosts.postStatus, "trash"))).limit(1);
    if (!source) throw new PageMutationError("missing");
  }
  let parent = BigInt(input.postParent || "0");
  const seen = new Set<bigint>();
  while (parent !== BigInt(0)) {
    if (parent === id || seen.has(parent) || seen.size >= 100) throw new PageMutationError("parent");
    seen.add(parent);
    const [row] = await database.select({ parent: wpPosts.postParent }).from(wpPosts).where(and(eq(wpPosts.id, parent), eq(wpPosts.postType, "page"), ne(wpPosts.postStatus, "trash"))).limit(1);
    if (!row) throw new PageMutationError("parent");
    parent = row.parent;
  }
}
async function protectHomepage(ids: bigint[], database: DB) {
  if (await getOption("show_on_front", "posts", database) !== "page") return;
  const home = await getOption("page_on_front", "", database);
  if (ids.some(id => id.toString() === home)) throw new PageMutationError("homepage");
}
async function savePageMeta(id: bigint, input: ReturnType<typeof createPageSchema.parse>, database: DB) {
  for (const [key, value] of [["_thumbnail_id", input.featuredImageId], ["_wp_page_template", input.template]] as const) {
    // An empty featured image deliberately clears it; undefined on a partial update preserves it.
    if (value === undefined && key !== "_thumbnail_id") continue;
    if (key === "_thumbnail_id" && !("featuredImageId" in input)) continue;
    await database.delete(wpPostmeta).where(and(eq(wpPostmeta.postId, id), eq(wpPostmeta.metaKey, key)));
    if (value) await database.insert(wpPostmeta).values({ postId: id, metaKey: key, metaValue: value });
  }
}
export async function createPage(raw: CreatePageInput, database: DB = db): Promise<string> {
  const session = await verifyAdmin();
  const input = createPageSchema.parse(raw);
  return database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await lockPages(tx);
    await validatePageLinks(input, undefined, tx);
    const slug = await uniquePageSlug(input.slug || input.title, undefined, tx);
    const now = new Date();
    const content = renderPostMedia(input.content || "");
    const [inserted] = await tx.insert(wpPosts).values({
      postAuthor: session.user.id, postDate: now, postDateGmt: now,
      postTitle: input.title, postContent: content,
      postExcerpt: contentPlainText(input.excerpt || content).slice(0, 20_000),
      postName: slug, postStatus: input.status || "draft", commentStatus: input.commentStatus || "closed",
      pingStatus: input.pingStatus || "closed", postPassword: input.postPassword || "",
      postParent: BigInt(input.postParent || "0"), menuOrder: input.menuOrder || 0,
      postModified: now, postModifiedGmt: now, guid: `/${slug}`, postType: "page",
    }).returning({ id: wpPosts.id });
    await savePageMeta(inserted.id, input, tx);
    const locale = input.languageCode || (await getDefaultLanguage(tx))?.code;
    if (!locale) throw new PageMutationError("invalid");
    await setPostLanguage(inserted.id, locale, input.translationOf ? BigInt(input.translationOf) : undefined, tx);
    return inserted.id.toString();
  });
}
export async function updatePage(id: bigint | string | number, raw: UpdatePageInput, database: DB = db): Promise<void> {
  await verifyAdmin();
  const pageId = pageIdSchema.parse(id);
  const input = updatePageSchema.parse(raw);
  if (pageId.toString() !== input.id) throw new PageMutationError("invalid");
  await database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await lockPages(tx);
    const [existing] = await lockedPages(tx, [pageId]);
    await validatePageLinks(input, pageId, tx);
    if (input.status && input.status !== "publish") await protectHomepage([pageId], tx);
    const slug = input.slug === undefined ? existing.slug : await uniquePageSlug(input.slug || input.title, pageId, tx);
    const now = new Date();
    await tx.update(wpPosts).set({
      postTitle: input.title, postName: slug, postModified: now, postModifiedGmt: now,
      ...(input.content !== undefined ? { postContent: renderPostMedia(input.content) } : {}),
      ...(input.excerpt !== undefined ? { postExcerpt: contentPlainText(input.excerpt) } : {}),
      ...(input.status !== undefined ? { postStatus: input.status } : {}),
      ...(input.commentStatus !== undefined ? { commentStatus: input.commentStatus } : {}),
      ...(input.pingStatus !== undefined ? { pingStatus: input.pingStatus } : {}),
      ...(input.postPassword !== undefined ? { postPassword: input.postPassword } : {}),
      ...(input.postParent !== undefined ? { postParent: BigInt(input.postParent) } : {}),
      ...(input.menuOrder !== undefined ? { menuOrder: input.menuOrder } : {}),
    }).where(and(eq(wpPosts.id, pageId), eq(wpPosts.postType, "page")));
    await savePageMeta(pageId, input, tx);
    if (input.languageCode) await setPostLanguage(pageId, input.languageCode, input.translationOf ? BigInt(input.translationOf) : undefined, tx);
  });
}
export async function quickUpdatePage(raw: QuickUpdatePageInput, database: DB = db): Promise<{id:string;title:string;slug:string;status:string;date:string}> {
  await verifyAdmin();
  const input = quickUpdatePageSchema.parse(raw);
  return database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await lockPages(tx);
    const [existing] = await lockedPages(tx, [BigInt(input.id)]);
    await validatePageLinks(input, BigInt(input.id), tx);
    if (input.status && input.status !== "publish") await protectHomepage([BigInt(input.id)], tx);
    const slug = input.slug === undefined ? existing.slug : await uniquePageSlug(input.slug || input.title, input.id, tx);
    const date = input.date ? new Date(input.date) : existing.date;
    await tx.update(wpPosts).set({ postTitle: input.title, postName: slug, postModified: new Date(), postModifiedGmt: new Date(),
      ...(input.date ? { postDate: date, postDateGmt: date } : {}),
      ...(input.status ? { postStatus: input.status } : {}),
      ...(input.commentStatus ? { commentStatus: input.commentStatus } : {}),
      ...(input.postPassword !== undefined ? { postPassword: input.postPassword } : {}),
      ...(input.postParent !== undefined ? { postParent: BigInt(input.postParent) } : {}),
      ...(input.menuOrder !== undefined ? { menuOrder: input.menuOrder } : {}),
    }).where(and(eq(wpPosts.id, BigInt(input.id)), eq(wpPosts.postType, "page")));
    return { id: input.id, title: input.title, slug, status: input.status || existing.status, date: date.toISOString() };
  });
}
async function changePageStatus(raw: (bigint|string|number)[], status: "trash"|"draft", database: DB) {
  await verifyAdmin();
  const ids = pageIdsSchema.parse(raw);
  await database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await lockPages(tx);
    const rows = await lockedPages(tx, ids);
    if (status === "draft" && rows.some(row => row.status !== "trash")) throw new PageMutationError("invalid");
    if (status === "trash") await protectHomepage(ids, tx);
    await tx.update(wpPosts).set({ postStatus: status, postModified: new Date(), postModifiedGmt: new Date() }).where(and(inArray(wpPosts.id, ids), eq(wpPosts.postType, "page")));
  });
}
export async function trashPages(ids: (bigint|string|number)[], database: DB = db): Promise<void> { return changePageStatus(ids, "trash", database); }
export async function restorePages(ids: (bigint|string|number)[], database: DB = db): Promise<void> { return changePageStatus(ids, "draft", database); }
export async function deletePages(raw: (bigint|string|number)[], database: DB = db): Promise<void> {
  await verifyAdmin();
  const ids = pageIdsSchema.parse(raw);
  await database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await lockPages(tx);
    const rows = await lockedPages(tx, ids);
    if (rows.some(row => row.status !== "trash")) throw new PageMutationError("invalid");
    await protectHomepage(ids, tx);
    await tx.update(wpPosts).set({ postParent: BigInt(0) }).where(and(eq(wpPosts.postType, "page"), inArray(wpPosts.postParent, ids)));
    await tx.delete(wpPostmeta).where(inArray(wpPostmeta.postId, ids));
    await tx.delete(postTranslationsTable).where(inArray(postTranslationsTable.postId, ids));
    await tx.delete(wpComments).where(inArray(wpComments.commentPostId, ids));
    await tx.delete(wpPosts).where(and(inArray(wpPosts.id, ids), eq(wpPosts.postType, "page")));
  });
}
export async function saveStudioPageData(...args: Parameters<typeof import("./studio-document.service").saveStudioPageData>) {
  await verifyAdmin();
  const service = await import("./studio-document.service");
  return service.saveStudioPageData(...args);
}
export async function setPageStudioMode(...args: Parameters<typeof import("./studio-document.service").setPageStudioMode>) {
  await verifyAdmin();
  const service = await import("./studio-document.service");
  return service.setPageStudioMode(...args);
}
export async function createDraftStudioPage(input: {title:string;languageCode?:string;translationOf?:string;userId?:string}, database: DB = db): Promise<string> {
  await verifyAdmin();
  return database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    const id = await createPage({ ...input, status: "draft", template: "studio_full_width" }, tx);
    await tx.insert(wpPostmeta).values([
      { postId: BigInt(id), metaKey: "_studio_edit_mode", metaValue: "builder" },
      { postId: BigInt(id), metaKey: "_studio_data", metaValue: JSON.stringify(parseStudioDocument(null)) },
    ]);
    return id;
  });
}
