import { eq, desc, asc, and, count, sql, inArray, ne, ilike, or } from "drizzle-orm";
import { DB, db } from "@/db";
import {
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
  wpTermmeta,
  createCategorySchema,
  updateCategorySchema,
  CategoryInput,
  UpdateCategoryInput,
  SelectTerm,
  SelectTermTaxonomy,
} from "@/db/schema/cms-taxonomy";
import { postTranslationsTable } from "@/db/schema/cms-languages";

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
    slug = `${base}-${suffix++}`.slice(0, 200);
  }
}

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent: string;
  termTaxonomyId: string;
  count: number;
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
  const { search, language, page, limit, orderBy = "name", order = "asc" } = options;

  const conditions = [eq(wpTermTaxonomy.taxonomy, "category")];

  if (language && language !== "all") {
    const metaTerms = await database
      .select({ termId: wpTermmeta.termId })
      .from(wpTermmeta)
      .where(and(eq(wpTermmeta.metaKey, "language"), eq(wpTermmeta.metaValue, language)));
    const metaTermIds = metaTerms.map((m) => m.termId);

    const postTerms = await database
      .selectDistinct({ termTaxonomyId: wpTermRelationships.termTaxonomyId })
      .from(wpTermRelationships)
      .innerJoin(
        postTranslationsTable,
        eq(sql`${wpTermRelationships.objectId}::bigint`, postTranslationsTable.postId)
      )
      .where(eq(postTranslationsTable.languageCode, language));
    const postTermTaxIds = postTerms.map((p) => p.termTaxonomyId);

    const langConditions = [];
    if (metaTermIds.length > 0) {
      langConditions.push(inArray(wpTerms.termId, metaTermIds));
    }
    if (postTermTaxIds.length > 0) {
      langConditions.push(inArray(wpTermTaxonomy.termTaxonomyId, postTermTaxIds));
    }

    if (langConditions.length > 0) {
      conditions.push(or(...langConditions)!);
    } else {
      conditions.push(eq(wpTerms.termId, BigInt(-1)));
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
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
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

  const categories: CategoryItem[] = rows.map((c) => ({
    id: c.termId.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    parent: c.parent?.toString() || "0",
    termTaxonomyId: c.termTaxonomyId.toString(),
    count: countMap.get(c.termId.toString()) ?? Number(c.count ?? 0),
  }));

  return { categories, total };
}

export async function getCategoryCounts(database: DB = db): Promise<CategoryCounts> {
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
  database: DB = db
): Promise<{ id: string; name: string; parent: string }[]> {
  const conditions = [eq(wpTermTaxonomy.taxonomy, "category")];

  if (excludeTermId !== undefined) {
    conditions.push(ne(wpTerms.termId, toBigInt(excludeTermId)));
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
  const termId = toBigInt(id);

  const rows = await database
    .select({
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      parent: wpTermTaxonomy.parent,
      termTaxonomyId: wpTermTaxonomy.termTaxonomyId,
      count: wpTermTaxonomy.count,
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(and(eq(wpTerms.termId, termId), eq(wpTermTaxonomy.taxonomy, "category")))
    .limit(1);

  if (!rows[0]) return null;

  const cat = rows[0];
  const [c] = await database
    .select({ count: count() })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, cat.termTaxonomyId));

  return {
    id: cat.termId.toString(),
    name: cat.name,
    slug: cat.slug,
    description: cat.description || "",
    parent: cat.parent?.toString() || "0",
    termTaxonomyId: cat.termTaxonomyId.toString(),
    count: Number(c?.count ?? cat.count ?? 0),
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
    })
    .from(wpTerms)
    .innerJoin(wpTermTaxonomy, eq(wpTerms.termId, wpTermTaxonomy.termId))
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
  };
}

// ---------------------------------------------------------------------------
// Category Mutations
// ---------------------------------------------------------------------------

export async function createCategory(
  data: CategoryInput,
  database: DB = db
): Promise<CategoryItem> {
  const parsed = createCategorySchema.parse(data);
  const slug = await uniqueCategorySlug(parsed.slug || parsed.name, undefined, database);

  const termId = await database.transaction(async (tx) => {
    const insertedTerm = await tx
      .insert(wpTerms)
      .values({
        name: parsed.name,
        slug,
        termGroup: BigInt(0),
      })
      .returning({ termId: wpTerms.termId });

    const newTermId = insertedTerm[0].termId;

    await tx.insert(wpTermTaxonomy).values({
      termId: newTermId,
      taxonomy: "category",
      description: parsed.description || "",
      parent: parsed.parent ?? BigInt(0),
      count: BigInt(0),
    });

    return newTermId;
  });

  const created = await getCategoryById(termId, database);
  if (!created) {
    throw new Error("Failed to retrieve created category.");
  }
  return created;
}

export async function updateCategory(
  id: bigint | string | number,
  data: Partial<CategoryInput>,
  database: DB = db
): Promise<CategoryItem> {
  const termId = toBigInt(id);
  const existing = await getCategoryById(termId, database);
  if (!existing) {
    throw new Error(`Category with ID ${id} not found.`);
  }

  const name = data.name !== undefined ? data.name.trim() : existing.name;
  if (!name) throw new Error("Category name is required.");

  let slug = existing.slug;
  if (data.slug !== undefined || data.name !== undefined) {
    const rawSlug = data.slug !== undefined && data.slug.trim().length > 0 ? data.slug : name;
    slug = await uniqueCategorySlug(rawSlug, termId, database);
  }

  const parent = data.parent !== undefined ? toBigInt(data.parent) : toBigInt(existing.parent);
  const description = data.description !== undefined ? data.description.trim() : existing.description;

  await database.transaction(async (tx) => {
    await tx
      .update(wpTerms)
      .set({ name, slug })
      .where(eq(wpTerms.termId, termId));

    await tx
      .update(wpTermTaxonomy)
      .set({ description, parent })
      .where(and(eq(wpTermTaxonomy.termId, termId), eq(wpTermTaxonomy.taxonomy, "category")));
  });

  const updated = await getCategoryById(termId, database);
  if (!updated) {
    throw new Error("Failed to retrieve updated category.");
  }
  return updated;
}

export async function quickUpdateCategory(
  id: bigint | string | number,
  data: { name: string; slug?: string },
  database: DB = db
): Promise<{ id: string; name: string; slug: string }> {
  const termId = toBigInt(id);
  const name = data.name.trim();
  if (!name) throw new Error("Category name is required.");

  const slug = await uniqueCategorySlug(data.slug || name, termId, database);

  await database
    .update(wpTerms)
    .set({ name, slug })
    .where(eq(wpTerms.termId, termId));

  return { id: id.toString(), name, slug };
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
  const termIds = ids.map((id) => toBigInt(id)).filter((id) => id > BigInt(0));
  if (!termIds.length) {
    return { success: false, error: "Select at least one category." };
  }

  // Find default uncategorized term to prevent its deletion
  const uncategorized = await database
    .select({ termId: wpTerms.termId })
    .from(wpTerms)
    .where(eq(wpTerms.slug, "uncategorized"))
    .limit(1);

  const safeTermIds = termIds.filter(
    (id) => !uncategorized[0] || id !== uncategorized[0].termId
  );

  if (!safeTermIds.length) {
    return { success: false, error: "The default category cannot be deleted." };
  }

  await database.transaction(async (tx) => {
    // Get taxonomy IDs for these terms
    const taxRows = await tx
      .select({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .where(
        and(
          eq(wpTermTaxonomy.taxonomy, "category"),
          inArray(wpTermTaxonomy.termId, safeTermIds)
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
    await tx.delete(wpTerms).where(inArray(wpTerms.termId, safeTermIds));
  });

  return { success: true, count: safeTermIds.length };
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
};
