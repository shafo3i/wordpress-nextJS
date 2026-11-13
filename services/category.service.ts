import "server-only";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  eq,
  desc,
  asc,
  and,
  count,
  sql,
  inArray,
  ne,
  ilike,
  or,
} from "drizzle-orm";
import { DB, db } from "@/db";
import {
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  createCategorySchema,
  updateCategorySchema,
  quickUpdateCategorySchema,
  deleteCategoriesSchema,
  categoryIdSchema,
  categoryQuerySchema,
  CategoryInput,
} from "@/db/schema/cms-taxonomy";
import {
  termTranslationsTable,
  languagesTable,
} from "@/db/schema/cms-languages";
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

export async function uniqueCategorySlug(
  title: string,
  termId?: bigint | string | number,
  database: DB = db
): Promise<string> {
  const base = toSlug(title) || `category-${Date.now()}`;
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

export interface LinkedCategoryTranslation {
  termTaxonomyId: string;
  termId: string;
  name: string;
  slug: string;
  languageCode: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent: string;
  termTaxonomyId: string;
  count: number;
  languageCode?: string;
  translationGroupId?: string;
  translations?: LinkedCategoryTranslation[];
}

export interface CreateCategoryOptions extends CategoryInput {
  languageCode?: string;
  sourceTermTaxonomyId?: bigint | string | number;
}

export interface UpdateCategoryOptions extends Partial<CategoryInput> {
  languageCode?: string;
  sourceTermTaxonomyId?: bigint | string | number;
}

export interface GetCategoriesOptions {
  search?: string;
  language?: string;
  page?: number;
  limit?: number;
  orderBy?: "name" | "count" | "id";
  order?: "asc" | "desc";
}

export interface CategoryCounts {
  all: number;
}

// ---------------------------------------------------------------------------
// Counter Synchronization
// ---------------------------------------------------------------------------

/**
 * Synchronizes the post count for a given term taxonomy ID.
 */
export async function syncCategoryCount(
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
// Category Queries
// ---------------------------------------------------------------------------

export async function getAllCategories(
  options: GetCategoriesOptions = {},
  database: DB = db
): Promise<{ categories: CategoryItem[]; total: number }> {
  const {
    search,
    language,
    page,
    limit,
    orderBy = "name",
    order = "asc",
  } = categoryQuerySchema.parse(options);

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
      parent: wpTermTaxonomy.parent,
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

  // Compute live post counts per category to ensure 100% accuracy
  const categoryCounts = await Promise.all(
    rows.map(async (cat) => {
      const c = await database
        .select({ count: count() })
        .from(wpTermRelationships)
        .where(eq(wpTermRelationships.termTaxonomyId, cat.termTaxonomyId));
      return {
        id: cat.termId.toString(),
        count: Number(c[0]?.count ?? 0),
      };
    })
  );

  const countMap = new Map(categoryCounts.map((item) => [item.id, item.count]));

  // Batch load translation links for the returned groups
  const groupIds = Array.from(
    new Set(rows.map((r) => r.translationGroupId).filter(Boolean))
  ) as string[];

  const groupTranslationsMap = new Map<string, LinkedCategoryTranslation[]>();
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

  const categories: CategoryItem[] = rows.map((c) => ({
    id: c.termId.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    parent: c.parent?.toString() || "0",
    termTaxonomyId: c.termTaxonomyId.toString(),
    count: countMap.get(c.termId.toString()) ?? Number(c.count ?? 0),
    languageCode: c.languageCode ?? "en",
    translationGroupId: c.translationGroupId ?? undefined,
    translations: c.translationGroupId
      ? (groupTranslationsMap.get(c.translationGroupId) ?? [])
      : [],
  }));

  return { categories, total };
}

export async function getCategoryCounts(
  database: DB = db
): Promise<CategoryCounts> {
  const [result] = await database
    .select({ total: count() })
    .from(wpTermTaxonomy)
    .where(eq(wpTermTaxonomy.taxonomy, "category"));

  return {
    all: Number(result?.total ?? 0),
  };
}

export async function getParentCategories(
  excludeTermId?: bigint | string | number,
  language?: string,
  database: DB = db
): Promise<{ id: string; name: string; parent: string }[]> {
  const conditions = [eq(wpTermTaxonomy.taxonomy, "category")];

  if (excludeTermId !== undefined) {
    conditions.push(ne(wpTerms.termId, categoryIdSchema.parse(excludeTermId)));
  }

  if (language && language !== "all") {
    const matching = await database
      .select({ termTaxonomyId: termTranslationsTable.termTaxonomyId })
      .from(termTranslationsTable)
      .where(eq(termTranslationsTable.languageCode, language));
    const taxIds = matching.map((m) => m.termTaxonomyId);
    if (taxIds.length > 0) {
      conditions.push(inArray(wpTermTaxonomy.termTaxonomyId, taxIds));
    } else {
      return [];
    }
  }

  const rows = await database
    .select({
      id: wpTerms.termId,
      name: wpTerms.name,
      parent: wpTermTaxonomy.parent,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(and(...conditions))
    .orderBy(asc(wpTerms.name));

  return rows.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    parent: r.parent?.toString() || "0",
  }));
}

export async function getCategoryById(
  id: bigint | string | number,
  database: DB = db
): Promise<CategoryItem | null> {
  const termId = categoryIdSchema.parse(id);

  const rows = await database
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      parent: wpTermTaxonomy.parent,
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
    .where(
      and(eq(wpTerms.termId, termId), eq(wpTermTaxonomy.taxonomy, "category"))
    )
    .limit(1);

  if (!rows[0]) return null;

  const cat = rows[0];
  const [c] = await database
    .select({ count: count() })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, cat.termTaxonomyId));

  let translations: LinkedCategoryTranslation[] = [];
  if (cat.translationGroupId) {
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
      .where(
        eq(termTranslationsTable.translationGroupId, cat.translationGroupId)
      );

    translations = trRows.map((r) => ({
      termTaxonomyId: r.termTaxonomyId.toString(),
      termId: r.termId.toString(),
      name: r.name,
      slug: r.slug,
      languageCode: r.languageCode,
    }));
  }

  return {
    id: cat.termId.toString(),
    name: cat.name,
    slug: cat.slug,
    description: cat.description || "",
    parent: cat.parent?.toString() || "0",
    termTaxonomyId: cat.termTaxonomyId.toString(),
    count: Number(c?.count ?? cat.count ?? 0),
    languageCode: cat.languageCode ?? "en",
    translationGroupId: cat.translationGroupId ?? undefined,
    translations,
  };
}

export async function getCategoryBySlug(
  slug: string,
  database: DB = db
): Promise<CategoryItem | null> {
  const rows = await database
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      parent: wpTermTaxonomy.parent,
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
    .where(and(eq(wpTerms.slug, slug), eq(wpTermTaxonomy.taxonomy, "category")))
    .limit(1);

  if (!rows[0]) return null;

  const cat = rows[0];
  return {
    id: cat.termId.toString(),
    name: cat.name,
    slug: cat.slug,
    description: cat.description || "",
    parent: cat.parent?.toString() || "0",
    termTaxonomyId: cat.termTaxonomyId.toString(),
    count: Number(cat.count ?? 0),
    languageCode: cat.languageCode ?? "en",
    translationGroupId: cat.translationGroupId ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Category Mutations
// ---------------------------------------------------------------------------

export class CategoryMutationError extends Error {
  constructor(public readonly key: string) {
    super(key);
  }
}

async function categoryTransaction<T>(
  database: DB,
  operation: (tx: DB) => Promise<T>
): Promise<T> {
  return database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB;
    // Serialize category hierarchy/group changes, including concurrent edits.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:categories'))`
    );
    return operation(tx);
  });
}

async function assertExclusiveCategoryTerm(tx: DB, ids: bigint[]) {
  const [shared] = await tx
    .select({ id: wpTermTaxonomy.termId })
    .from(wpTermTaxonomy)
    .where(
      and(
        inArray(wpTermTaxonomy.termId, ids),
        ne(wpTermTaxonomy.taxonomy, "category")
      )
    )
    .limit(1);
  if (shared) throw new CategoryMutationError("admin.categories.error.shared");
}

async function validateCategoryLinks(
  tx: DB,
  parent: bigint,
  termId: bigint | undefined,
  languageCode: string | undefined,
  sourceId: bigint | undefined,
  currentTaxId?: bigint
) {
  const categories = await tx
    .select({
      termId: wpTermTaxonomy.termId,
      taxId: wpTermTaxonomy.termTaxonomyId,
      parent: wpTermTaxonomy.parent,
    })
    .from(wpTermTaxonomy)
    .where(eq(wpTermTaxonomy.taxonomy, "category"));
  const byId = new Map(
    categories.map((category) => [category.termId, category])
  );
  const visited = new Set<bigint>();
  let ancestor = parent;
  while (ancestor !== BigInt(0)) {
    if (ancestor === termId || visited.has(ancestor) || !byId.has(ancestor))
      throw new CategoryMutationError("admin.categories.error.parent");
    visited.add(ancestor);
    ancestor = byId.get(ancestor)!.parent;
  }
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
    throw new CategoryMutationError("admin.categories.error.language");
  if (sourceId) {
    if (
      sourceId === currentTaxId ||
      !categories.some((category) => category.taxId === sourceId)
    )
      throw new CategoryMutationError("admin.categories.error.translation");
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
      throw new CategoryMutationError("admin.categories.error.translation");
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
        throw new CategoryMutationError("admin.categories.error.translation");
    }
  }
  return language.code;
}

export async function createCategory(
  data: CreateCategoryOptions,
  database: DB = db
): Promise<CategoryItem> {
  await verifyAdminOrEditor();
  const parsed = createCategorySchema.parse(data);
  return categoryTransaction(database, async (tx) => {
    const language = await validateCategoryLinks(
      tx,
      parsed.parent,
      undefined,
      parsed.languageCode,
      parsed.sourceTermTaxonomyId
    );
    const slug = await uniqueCategorySlug(
      parsed.slug || parsed.name,
      undefined,
      tx
    );
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
        taxonomy: "category",
        description: parsed.description || "",
        parent: parsed.parent ?? BigInt(0),
        count: BigInt(0),
      })
      .returning({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId });

    await setTermLanguage(
      insertedTax[0].termTaxonomyId,
      language,
      parsed.sourceTermTaxonomyId,
      tx
    );
    const created = await getCategoryById(newTermId, tx);
    if (!created)
      throw new CategoryMutationError("admin.categories.error.failed");
    return created;
  });
}

export async function updateCategory(
  id: bigint | string | number,
  data: UpdateCategoryOptions,
  database: DB = db
): Promise<CategoryItem> {
  await verifyAdminOrEditor();
  const parsed = updateCategorySchema.parse({ ...data, termId: id });
  const termId = parsed.termId;
  return categoryTransaction(database, async (tx) => {
    const existing = await getCategoryById(termId, tx);
    if (!existing)
      throw new CategoryMutationError("admin.categories.error.not_found");
    await assertExclusiveCategoryTerm(tx, [termId]);
    const name = parsed.name ?? existing.name;

    let slug = existing.slug;
    if (
      existing.slug !== "uncategorized" &&
      (parsed.slug !== undefined || parsed.name !== undefined)
    ) {
      const rawSlug = parsed.slug || name;
      slug = await uniqueCategorySlug(rawSlug, termId, tx);
    }

    const parent = parsed.parent ?? BigInt(existing.parent);
    const description = parsed.description ?? existing.description;
    const language = await validateCategoryLinks(
      tx,
      parent,
      termId,
      parsed.languageCode || existing.languageCode,
      parsed.sourceTermTaxonomyId,
      BigInt(existing.termTaxonomyId)
    );
    await tx
      .update(wpTerms)
      .set({ name, slug })
      .where(eq(wpTerms.termId, termId));

    await tx
      .update(wpTermTaxonomy)
      .set({ description, parent })
      .where(
        and(
          eq(wpTermTaxonomy.termId, termId),
          eq(wpTermTaxonomy.taxonomy, "category")
        )
      );
    await setTermLanguage(
      BigInt(existing.termTaxonomyId),
      language,
      parsed.sourceTermTaxonomyId,
      tx
    );
    const updated = await getCategoryById(termId, tx);
    if (!updated)
      throw new CategoryMutationError("admin.categories.error.failed");
    return updated;
  });
}

export async function quickUpdateCategory(
  id: bigint | string | number,
  data: { name: string; slug?: string },
  database: DB = db
): Promise<{ id: string; name: string; slug: string }> {
  await verifyAdminOrEditor();
  const parsed = quickUpdateCategorySchema.parse({ ...data, id });
  return categoryTransaction(database, async (tx) => {
    const existing = await getCategoryById(parsed.id, tx);
    if (!existing)
      throw new CategoryMutationError("admin.categories.error.not_found");
    await assertExclusiveCategoryTerm(tx, [parsed.id]);
    const slug =
      existing.slug === "uncategorized"
        ? existing.slug
        : await uniqueCategorySlug(parsed.slug || parsed.name, parsed.id, tx);
    await tx
      .update(wpTerms)
      .set({ name: parsed.name, slug })
      .where(eq(wpTerms.termId, parsed.id));
    return { id: parsed.id.toString(), name: parsed.name, slug };
  });
}

export async function deleteCategory(
  id: bigint | string | number,
  database: DB = db
): Promise<{ success: boolean; error?: string }> {
  return bulkDeleteCategories([id], database);
}

export async function bulkDeleteCategories(
  ids: (bigint | string | number)[],
  database: DB = db
): Promise<{ success: boolean; count?: number; error?: string }> {
  await verifyAdminOrEditor();
  const termIds = deleteCategoriesSchema.parse(ids);
  return categoryTransaction(database, async (tx) => {
    const taxRows = await tx
      .select({
        termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
        termId: wpTerms.termId,
        slug: wpTerms.slug,
        parent: wpTermTaxonomy.parent,
      })
      .from(wpTermTaxonomy)
      .innerJoin(wpTerms, eq(wpTerms.termId, wpTermTaxonomy.termId))
      .where(
        and(
          eq(wpTermTaxonomy.taxonomy, "category"),
          inArray(wpTermTaxonomy.termId, termIds)
        )
      );

    if (taxRows.length !== termIds.length)
      throw new CategoryMutationError("admin.categories.error.not_found");
    if (taxRows.some((row) => row.slug === "uncategorized"))
      throw new CategoryMutationError("admin.categories.error.default");
    // A term shared with a tag/menu must never be renamed/deleted through Categories.
    await assertExclusiveCategoryTerm(tx, termIds);
    const taxIds = taxRows.map((r) => r.termTaxonomyId);
    if (taxIds.length) {
      await tx
        .delete(wpTermRelationships)
        .where(inArray(wpTermRelationships.termTaxonomyId, taxIds));
      await tx
        .delete(wpTermTaxonomy)
        .where(inArray(wpTermTaxonomy.termTaxonomyId, taxIds));
    }
    // Surviving children become roots instead of referencing removed parents.
    await tx
      .update(wpTermTaxonomy)
      .set({ parent: BigInt(0) })
      .where(
        and(
          eq(wpTermTaxonomy.taxonomy, "category"),
          inArray(wpTermTaxonomy.parent, termIds)
        )
      );
    await tx.delete(wpTerms).where(inArray(wpTerms.termId, termIds));
    return { success: true, count: taxRows.length };
  });
}

export async function getAllCategoriesWithPosts(
  languageCode?: string,
  page: number = 1,
  limit: number = 20,
  orderBy: "name" | "count" | "id" = "name",
  order: "asc" | "desc" = "desc",
  database: DB = db
) {
  const categoryWithPosts = await db.query.wpTermTaxonomy.findMany({
    where: {
      taxonomy: "category",
    },
  });
  return categoryWithPosts;
}

// ---------------------------------------------------------------------------
// Consolidated Category Service Export
// ---------------------------------------------------------------------------

export const categoryService = {
  getAll: getAllCategories,
  getById: getCategoryById,
  getBySlug: getCategoryBySlug,
  getCounts: getCategoryCounts,
  getParents: getParentCategories,
  create: createCategory,
  update: updateCategory,
  quickUpdate: quickUpdateCategory,
  delete: deleteCategory,
  bulkDelete: bulkDeleteCategories,
  syncCount: syncCategoryCount,
  getAllWithPosts: getAllCategoriesWithPosts,
};
