import "server-only";
import { verifyPostEditor } from "@/lib/authMIddleware";
import { eq, desc, asc, and, count, sql, inArray, ne, ilike, or } from "drizzle-orm";
import { DB, db } from "@/db";
import {
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  createTagSchema,
  quickUpdateTagSchema,
  deleteTagsSchema,
  categoryIdSchema,
  tagQuerySchema,
  updateTagSchema,
  TagInput,
} from "@/db/schema/cms-taxonomy";
import { termTranslationsTable, languagesTable } from "@/db/schema/cms-languages";
import { setTermLanguage } from "./language.service";

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
    .replace(/[^\p{L}\p{N}0-9_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export async function uniqueTagSlug(
  title: string,
  termId?: bigint | string | number,
  database: DB = db
): Promise<string> {
  const base = toSlug(title) || `tag-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  const currentId = termId !== undefined ? toBigInt(termId) : undefined;

  while (true) {
    const existing = await database
      .select({ id: wpTerms.termId })
      .from(wpTerms)
      .where(
        and(
          eq(wpTerms.slug, slug),
          currentId ? ne(wpTerms.termId, currentId) : undefined
        )
      )
      .limit(1);

    if (!existing.length) return slug;
    const ending = `-${suffix++}`;
    slug = `${base.slice(0, 200 - ending.length)}${ending}`;
  }
}

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface LinkedTagTranslation {
  termTaxonomyId: string;
  termId: string;
  name: string;
  slug: string;
  languageCode: string;
}

export interface TagItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  termTaxonomyId: string;
  count: number;
  languageCode?: string;
  translationGroupId?: string;
  translations?: LinkedTagTranslation[];
}

export interface CreateTagOptions extends TagInput {
  languageCode?: string;
  sourceTermTaxonomyId?: bigint | string | number;
}

export interface UpdateTagOptions extends Partial<TagInput> {
  languageCode?: string;
  sourceTermTaxonomyId?: bigint | string | number;
}

export interface GetTagsOptions {
  search?: string;
  language?: string;
  page?: number;
  limit?: number;
  orderBy?: "name" | "count" | "id";
  order?: "asc" | "desc";
}

export interface TagCounts {
  all: number;
}

// ---------------------------------------------------------------------------
// Counter Synchronization
// ---------------------------------------------------------------------------

/**
 * Synchronizes the post count for a given term taxonomy ID.
 */
export async function syncTagCount(
  termTaxonomyId: bigint | string | number,
  database: DB = db
): Promise<bigint> {
  await verifyPostEditor();
  const taxId = categoryIdSchema.parse(termTaxonomyId);

  const [result] = await database
    .select({ total: count() })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, taxId));

  const total = result?.total ? BigInt(result.total) : BigInt(0);

  await database
    .update(wpTermTaxonomy)
    .set({ count: total })
    .where(and(eq(wpTermTaxonomy.termTaxonomyId, taxId), eq(wpTermTaxonomy.taxonomy, "post_tag")));

  return total;
}

// ---------------------------------------------------------------------------
// Tag Queries
// ---------------------------------------------------------------------------

export async function getAllTags(
  options: GetTagsOptions = {},
  database: DB = db
): Promise<{ tags: TagItem[]; total: number }> {
  const { search, language, page = 1, limit = 20, orderBy = "name", order = "asc" } = tagQuerySchema.parse(options);

  const conditions = [eq(wpTermTaxonomy.taxonomy, "post_tag")];

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

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(wpTerms.name, term),
        ilike(wpTerms.slug, term),
        ilike(wpTermTaxonomy.description, term)
      )!
    );
  }

  const whereClause = and(...conditions);

  // Total count for pagination
  const [countRes] = await database
    .select({ total: count() })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(whereClause);

  const total = Number(countRes?.total ?? 0);

  // Order clause
  let orderColumn;
  if (orderBy === "count") {
    orderColumn = wpTermTaxonomy.count;
  } else if (orderBy === "id") {
    orderColumn = wpTerms.termId;
  } else {
    orderColumn = wpTerms.name;
  }
  const orderExpr = order === "desc" ? desc(orderColumn) : asc(orderColumn);

  let query = database
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
      count: wpTermTaxonomy.count,
      languageCode: termTranslationsTable.languageCode,
      translationGroupId: termTranslationsTable.translationGroupId,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .leftJoin(
      termTranslationsTable,
      eq(wpTermTaxonomy.termTaxonomyId, termTranslationsTable.termTaxonomyId)
    )
    .where(whereClause)
    .orderBy(orderExpr)
    .$dynamic();

  if (limit && limit > 0) {
    const offset = Math.max(0, ((page ?? 1) - 1) * limit);
    query = query.limit(limit).offset(offset);
  }

  const rows = await query;

  // Compute live post counts per tag to ensure 100% accuracy
  const tagCounts = await Promise.all(
    rows.map(async (tag) => {
      const c = await database
        .select({ count: count() })
        .from(wpTermRelationships)
        .where(eq(wpTermRelationships.termTaxonomyId, tag.termTaxonomyId));
      return {
        id: tag.termId.toString(),
        count: Number(c[0]?.count ?? 0),
      };
    })
  );

  const countMap = new Map(tagCounts.map((item) => [item.id, item.count]));

  // Batch load translation links for the returned groups
  const groupIds = Array.from(
    new Set(rows.map((r) => r.translationGroupId).filter(Boolean))
  ) as string[];

  const groupTranslationsMap = new Map<string, LinkedTagTranslation[]>();
  if (groupIds.length > 0) {
    const allGroupTerms = await database
      .select({
        termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
        termId: wpTerms.termId,
        name: wpTerms.name,
        slug: wpTerms.slug,
        languageCode: termTranslationsTable.languageCode,
        translationGroupId: termTranslationsTable.translationGroupId,
      })
      .from(termTranslationsTable)
      .innerJoin(
        wpTermTaxonomy,
        eq(termTranslationsTable.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
      )
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(and(inArray(termTranslationsTable.translationGroupId, groupIds), eq(wpTermTaxonomy.taxonomy, "post_tag")));

    for (const item of allGroupTerms) {
      const gid = item.translationGroupId;
      if (!groupTranslationsMap.has(gid)) {
        groupTranslationsMap.set(gid, []);
      }
      groupTranslationsMap.get(gid)!.push({
        termTaxonomyId: item.termTaxonomyId.toString(),
        termId: item.termId.toString(),
        name: item.name,
        slug: item.slug,
        languageCode: item.languageCode,
      });
    }
  }

  const tags: TagItem[] = rows.map((t) => ({
    id: t.termId.toString(),
    name: t.name,
    slug: t.slug,
    description: t.description || "",
    termTaxonomyId: t.termTaxonomyId.toString(),
    count: countMap.get(t.termId.toString()) ?? Number(t.count ?? 0),
    languageCode: t.languageCode ?? "en",
    translationGroupId: t.translationGroupId ?? undefined,
    translations: t.translationGroupId ? groupTranslationsMap.get(t.translationGroupId) ?? [] : [],
  }));

  return { tags, total };
}

export async function getTagCounts(database: DB = db): Promise<TagCounts> {
  const [result] = await database
    .select({ total: count() })
    .from(wpTermTaxonomy)
    .where(eq(wpTermTaxonomy.taxonomy, "post_tag"));

  return {
    all: Number(result?.total ?? 0),
  };
}

export async function getTagById(
  id: bigint | string | number,
  database: DB = db
): Promise<TagItem | null> {
  const termId = categoryIdSchema.parse(id);

  const rows = await database
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
      count: wpTermTaxonomy.count,
      languageCode: termTranslationsTable.languageCode,
      translationGroupId: termTranslationsTable.translationGroupId,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .leftJoin(
      termTranslationsTable,
      eq(wpTermTaxonomy.termTaxonomyId, termTranslationsTable.termTaxonomyId)
    )
    .where(and(eq(wpTerms.termId, termId), eq(wpTermTaxonomy.taxonomy, "post_tag")))
    .limit(1);

  if (!rows[0]) return null;

  const tag = rows[0];
  const [c] = await database
    .select({ count: count() })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, tag.termTaxonomyId));

  let translations: LinkedTagTranslation[] = [];
  if (tag.translationGroupId) {
    const trRows = await database
      .select({
        termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
        termId: wpTerms.termId,
        name: wpTerms.name,
        slug: wpTerms.slug,
        languageCode: termTranslationsTable.languageCode,
      })
      .from(termTranslationsTable)
      .innerJoin(
        wpTermTaxonomy,
        eq(termTranslationsTable.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
      )
      .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
      .where(and(eq(termTranslationsTable.translationGroupId, tag.translationGroupId), eq(wpTermTaxonomy.taxonomy, "post_tag")));

    translations = trRows.map((r) => ({
      termTaxonomyId: r.termTaxonomyId.toString(),
      termId: r.termId.toString(),
      name: r.name,
      slug: r.slug,
      languageCode: r.languageCode,
    }));
  }

  return {
    id: tag.termId.toString(),
    name: tag.name,
    slug: tag.slug,
    description: tag.description || "",
    termTaxonomyId: tag.termTaxonomyId.toString(),
    count: Number(c?.count ?? tag.count ?? 0),
    languageCode: tag.languageCode ?? "en",
    translationGroupId: tag.translationGroupId ?? undefined,
    translations,
  };
}

export async function getTagBySlug(
  slug: string,
  database: DB = db
): Promise<TagItem | null> {
  const rows = await database
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
      count: wpTermTaxonomy.count,
      languageCode: termTranslationsTable.languageCode,
      translationGroupId: termTranslationsTable.translationGroupId,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .leftJoin(
      termTranslationsTable,
      eq(wpTermTaxonomy.termTaxonomyId, termTranslationsTable.termTaxonomyId)
    )
    .where(and(eq(wpTerms.slug, slug), eq(wpTermTaxonomy.taxonomy, "post_tag")))
    .limit(1);

  if (!rows[0]) return null;

  const tag = rows[0];
  return {
    id: tag.termId.toString(),
    name: tag.name,
    slug: tag.slug,
    description: tag.description || "",
    termTaxonomyId: tag.termTaxonomyId.toString(),
    count: Number(tag.count ?? 0),
    languageCode: tag.languageCode ?? "en",
    translationGroupId: tag.translationGroupId ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Tag Mutations
// ---------------------------------------------------------------------------

async function validateTagLinks(
  tx: DB,
  languageCode: string | undefined,
  sourceId: bigint | undefined,
  currentTaxId?: bigint
) {
  const tags = await tx
    .select({
      termId: wpTermTaxonomy.termId,
      taxId: wpTermTaxonomy.termTaxonomyId,
      parent: wpTermTaxonomy.parent,
    })
    .from(wpTermTaxonomy)
    .where(eq(wpTermTaxonomy.taxonomy, "post_tag"));
  const [language] = await tx
    .select({ code: languagesTable.code })
    .from(languagesTable)
    .where(
      languageCode
        ? and(
            eq(languagesTable.code, languageCode),
            eq(languagesTable.isActive, true)
          )
        : and(
            eq(languagesTable.isDefault, true),
            eq(languagesTable.isActive, true)
          )
    )
    .limit(1);
  if (!language)
    throw new Error("admin.tags.error.language");
  if (sourceId) {
    if (
      sourceId === currentTaxId ||
      !tags.some((tag) => tag.taxId === sourceId)
    )
      throw new Error("admin.tags.error.translation");
    const translations = await tx
      .select({
        taxId: termTranslationsTable.termTaxonomyId,
        locale: termTranslationsTable.languageCode,
        group: termTranslationsTable.translationGroupId,
      })
      .from(termTranslationsTable);
    const source = translations.find((item) => item.taxId === sourceId);
    if (
      !source ||
      source.locale === language.code ||
      translations.some(
        (item) =>
          item.group === source.group &&
          item.locale === language.code &&
          item.taxId !== currentTaxId
      )
    )
      throw new Error("admin.tags.error.translation");
  } else if (currentTaxId) {
    const [current] = await tx
      .select({ group: termTranslationsTable.translationGroupId })
      .from(termTranslationsTable)
      .where(eq(termTranslationsTable.termTaxonomyId, currentTaxId))
      .limit(1);
    if (current) {
      const [duplicate] = await tx
        .select({ id: termTranslationsTable.termTaxonomyId })
        .from(termTranslationsTable)
        .where(
          and(
            eq(termTranslationsTable.translationGroupId, current.group),
            eq(termTranslationsTable.languageCode, language.code),
            ne(termTranslationsTable.termTaxonomyId, currentTaxId)
          )
        )
        .limit(1);
      if (duplicate)
        throw new Error("admin.tags.error.translation");
    }
  }
  return language.code;
}

async function tagTransaction<T>(database: DB, operation: (tx: DB) => Promise<T>): Promise<T> {
  return database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:tags'))`);
    return operation(tx);
  });
}
async function assertExclusiveTag(tx: DB, ids: bigint[]) {
  const [shared] = await tx.select({ id: wpTermTaxonomy.termId }).from(wpTermTaxonomy)
    .where(and(inArray(wpTermTaxonomy.termId, ids), ne(wpTermTaxonomy.taxonomy, "post_tag"))).limit(1);
  if (shared) throw new Error("admin.tags.error.shared");
}


export async function createTag(
  data: CreateTagOptions,
  database: DB = db
): Promise<TagItem> {
  await verifyPostEditor();
  const parsed = createTagSchema.parse(data);
  return tagTransaction(database, async tx => {
    const language = await validateTagLinks(tx, parsed.languageCode, parsed.sourceTermTaxonomyId);
    const slug = await uniqueTagSlug(parsed.slug || parsed.name, undefined, tx);
    const [term] = await tx.insert(wpTerms).values({ name: parsed.name, slug, termGroup: BigInt(0) }).returning({ termId: wpTerms.termId });
    const [taxonomy] = await tx.insert(wpTermTaxonomy).values({ termId: term.termId, taxonomy: "post_tag", description: parsed.description, parent: BigInt(0), count: BigInt(0) }).returning({ id: wpTermTaxonomy.termTaxonomyId });
    await setTermLanguage(taxonomy.id, language, parsed.sourceTermTaxonomyId, tx);
    const created = await getTagById(term.termId, tx);
    if (!created) throw new Error("admin.tags.error.missing");
    return created;
  });
}

export async function updateTag(id: bigint | string | number, data: UpdateTagOptions, database: DB = db): Promise<TagItem> {
  await verifyPostEditor();
  const parsed = updateTagSchema.parse({ ...data, termId: id });
  return tagTransaction(database, async tx => {
    const existing = await getTagById(parsed.termId, tx);
    if (!existing) throw new Error("admin.tags.error.missing");
    await assertExclusiveTag(tx, [parsed.termId]);
    const taxId = categoryIdSchema.parse(existing.termTaxonomyId);
    const language = await validateTagLinks(tx, parsed.languageCode || existing.languageCode, parsed.sourceTermTaxonomyId, taxId);
    const name = parsed.name ?? existing.name;
    const slug = parsed.slug !== undefined || parsed.name !== undefined ? await uniqueTagSlug(parsed.slug || name, parsed.termId, tx) : existing.slug;
    await tx.update(wpTerms).set({ name, slug }).where(eq(wpTerms.termId, parsed.termId));
    await tx.update(wpTermTaxonomy).set({ description: parsed.description ?? existing.description }).where(and(eq(wpTermTaxonomy.termTaxonomyId, taxId), eq(wpTermTaxonomy.taxonomy, "post_tag")));
    await setTermLanguage(taxId, language, parsed.sourceTermTaxonomyId, tx);
    const updated = await getTagById(parsed.termId, tx);
    if (!updated) throw new Error("admin.tags.error.missing");
    return updated;
  });
}

export async function quickUpdateTag(id: bigint | string | number, data: { name: string; slug?: string }, database: DB = db): Promise<{ id: string; name: string; slug: string }> {
  await verifyPostEditor();
  const parsed = quickUpdateTagSchema.parse({ ...data, id });
  const updated = await updateTag(parsed.id, { name: parsed.name, slug: parsed.slug }, database);
  return { id: updated.id, name: updated.name, slug: updated.slug };
}

export async function deleteTag(
  id: bigint | string | number,
  database: DB = db
): Promise<{ success: boolean; error?: string }> {
  return bulkDeleteTags([id], database);
}

export async function bulkDeleteTags(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<{ success: boolean; count?: number; error?: string }> {
  await verifyPostEditor();
  const termIds = deleteTagsSchema.parse(ids);
  if (!termIds.length) {
    return { success: false };
  }

  let deletedCount = 0;
  await tagTransaction(database, async (tx) => {
    await assertExclusiveTag(tx, termIds);
    // Get taxonomy IDs for these terms
    const taxRows = await tx
      .select({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId, termId: wpTermTaxonomy.termId })
      .from(wpTermTaxonomy)
      .where(
        and(
          eq(wpTermTaxonomy.taxonomy, "post_tag"),
          inArray(wpTermTaxonomy.termId, termIds)
        )
      );

    const taxIds = taxRows.map((r) => r.termTaxonomyId);
    if (taxIds.length) {
      await tx
        .delete(wpTermRelationships)
        .where(inArray(wpTermRelationships.termTaxonomyId, taxIds));
      await tx
        .delete(wpTermTaxonomy)
        .where(inArray(wpTermTaxonomy.termTaxonomyId, taxIds));
    }
    const matchedIds = taxRows.map(row => row.termId);
    deletedCount = matchedIds.length;
    if (matchedIds.length) await tx.delete(wpTerms).where(inArray(wpTerms.termId, matchedIds));
  });

  return { success: true, count: deletedCount };
}

// ---------------------------------------------------------------------------
// Consolidated Tag Service Export
// ---------------------------------------------------------------------------

export const tagService = {
  getAll: getAllTags,
  getById: getTagById,
  getBySlug: getTagBySlug,
  getCounts: getTagCounts,
  create: createTag,
  update: updateTag,
  quickUpdate: quickUpdateTag,
  delete: deleteTag,
  bulkDelete: bulkDeleteTags,
  syncCount: syncTagCount,
};
