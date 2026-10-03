import { eq, desc, asc, and, count, sql, inArray, ne, ilike, or } from "drizzle-orm";
import { DB, db } from "@/db";
import {
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  wpTermmeta,
  createTagSchema,
  updateTagSchema,
  TagInput,
  UpdateTagInput,
  SelectTerm,
  SelectTermTaxonomy,
} from "@/db/schema/cms-taxonomy";
import { postTranslationsTable, termTranslationsTable, languagesTable } from "@/db/schema/cms-languages";
import { setTermLanguage, getTermLanguage, getTermTranslations } from "./language.service";

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
    slug = `${base}-${suffix++}`.slice(0, 200);
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
  const taxId = toBigInt(termTaxonomyId);

  const [result] = await database
    .select({ total: count() })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, taxId));

  const total = result?.total ? BigInt(result.total) : BigInt(0);

  await database
    .update(wpTermTaxonomy)
    .set({ count: total })
    .where(eq(wpTermTaxonomy.termTaxonomyId, taxId));

  return total;
}

// ---------------------------------------------------------------------------
// Tag Queries
// ---------------------------------------------------------------------------

export async function getAllTags(
  options: GetTagsOptions = {},
  database: DB = db
): Promise<{ tags: TagItem[]; total: number }> {
  const { search, language, page, limit, orderBy = "name", order = "asc" } = options;

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
      .where(inArray(termTranslationsTable.translationGroupId, groupIds));

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
  const termId = toBigInt(id);

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
      .where(eq(termTranslationsTable.translationGroupId, tag.translationGroupId));

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

export async function createTag(
  data: CreateTagOptions,
  database: DB = db
): Promise<TagItem> {
  const parsed = createTagSchema.parse(data);
  const slug = await uniqueTagSlug(parsed.slug || parsed.name, undefined, database);

  const { termId, termTaxonomyId } = await database.transaction(async (tx) => {
    const insertedTerm = await tx
      .insert(wpTerms)
      .values({
        name: parsed.name,
        slug,
        termGroup: BigInt(0),
      })
      .returning({ termId: wpTerms.termId });

    const newTermId = insertedTerm[0].termId;

    const insertedTax = await tx
      .insert(wpTermTaxonomy)
      .values({
        termId: newTermId,
        taxonomy: "post_tag",
        description: parsed.description || "",
        parent: BigInt(0),
        count: BigInt(0),
      })
      .returning({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId });

    return { termId: newTermId, termTaxonomyId: insertedTax[0].termTaxonomyId };
  });

  const langCode = data.languageCode || "en";
  const sourceTaxId = data.sourceTermTaxonomyId ? toBigInt(data.sourceTermTaxonomyId) : undefined;
  await setTermLanguage(termTaxonomyId, langCode, sourceTaxId, database);

  const created = await getTagById(termId, database);
  if (!created) {
    throw new Error("Failed to retrieve created tag.");
  }
  return created;
}

export async function updateTag(
  id: bigint | string | number,
  data: UpdateTagOptions,
  database: DB = db
): Promise<TagItem> {
  const termId = toBigInt(id);
  const existing = await getTagById(termId, database);
  if (!existing) {
    throw new Error(`Tag with ID ${id} not found.`);
  }

  const name = data.name !== undefined ? data.name.trim() : existing.name;
  if (!name) throw new Error("Tag name is required.");

  let slug = existing.slug;
  if (data.slug !== undefined || data.name !== undefined) {
    const rawSlug = data.slug !== undefined && data.slug.trim().length > 0 ? data.slug : name;
    slug = await uniqueTagSlug(rawSlug, termId, database);
  }

  const description = data.description !== undefined ? data.description.trim() : existing.description;

  await database.transaction(async (tx) => {
    await tx
      .update(wpTerms)
      .set({ name, slug })
      .where(eq(wpTerms.termId, termId));

    await tx
      .update(wpTermTaxonomy)
      .set({ description })
      .where(and(eq(wpTermTaxonomy.termId, termId), eq(wpTermTaxonomy.taxonomy, "post_tag")));
  });

  if (data.languageCode) {
    const sourceTaxId = data.sourceTermTaxonomyId ? toBigInt(data.sourceTermTaxonomyId) : undefined;
    await setTermLanguage(toBigInt(existing.termTaxonomyId), data.languageCode, sourceTaxId, database);
  }

  const updated = await getTagById(termId, database);
  if (!updated) {
    throw new Error("Failed to retrieve updated tag.");
  }
  return updated;
}

export async function quickUpdateTag(
  id: bigint | string | number,
  data: { name: string; slug?: string },
  database: DB = db
): Promise<{ id: string; name: string; slug: string }> {
  const termId = toBigInt(id);
  const name = data.name.trim();
  if (!name) throw new Error("Tag name is required.");

  const slug = await uniqueTagSlug(data.slug || name, termId, database);

  await database
    .update(wpTerms)
    .set({ name, slug })
    .where(eq(wpTerms.termId, termId));

  return { id: id.toString(), name, slug };
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
  const termIds = ids.map((id) => toBigInt(id)).filter((id) => id > BigInt(0));
  if (!termIds.length) {
    return { success: false, error: "Select at least one tag." };
  }

  await database.transaction(async (tx) => {
    // Get taxonomy IDs for these terms
    const taxRows = await tx
      .select({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId })
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
    await tx.delete(wpTerms).where(inArray(wpTerms.termId, termIds));
  });

  return { success: true, count: termIds.length };
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
