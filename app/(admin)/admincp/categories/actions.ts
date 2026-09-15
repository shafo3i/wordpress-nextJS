"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { wpTermRelationships, wpTermTaxonomy, wpTerms } from "@/db/schema";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

async function uniqueCategorySlug(title: string, termId?: bigint) {
  const base = toSlug(title) || `category-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  while (true) {
    const existing = await db
      .select({ id: wpTerms.termId })
      .from(wpTerms)
      .where(and(eq(wpTerms.slug, slug), termId ? ne(wpTerms.termId, termId) : undefined))
      .limit(1);
    if (!existing.length) return slug;
    slug = `${base}-${suffix++}`.slice(0, 200);
  }
}

export async function createCategory(formData: FormData) {
  await verifyAdminOrEditor();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");

  const customSlug = String(formData.get("slug") ?? "").trim();
  const slug = await uniqueCategorySlug(customSlug || name);
  const parent = BigInt(Number(formData.get("parent") ?? "0") || 0);
  const description = String(formData.get("description") ?? "").trim();

  await db.transaction(async (tx) => {
    const insertedTerm = await tx
      .insert(wpTerms)
      .values({
        name,
        slug,
        termGroup: BigInt(0),
      })
      .returning({ termId: wpTerms.termId });

    await tx.insert(wpTermTaxonomy).values({
      termId: insertedTerm[0].termId,
      taxonomy: "category",
      description,
      parent,
      count: BigInt(0),
    });
  });

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  await verifyAdminOrEditor();
  const termId = BigInt(String(formData.get("termId") ?? "0"));
  if (termId <= BigInt(0)) throw new Error("A valid category ID is required.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");

  const customSlug = String(formData.get("slug") ?? "").trim();
  const slug = await uniqueCategorySlug(customSlug || name, termId);
  const parent = BigInt(Number(formData.get("parent") ?? "0") || 0);
  const description = String(formData.get("description") ?? "").trim();

  await db.transaction(async (tx) => {
    await tx
      .update(wpTerms)
      .set({ name, slug })
      .where(eq(wpTerms.termId, termId));

    await tx
      .update(wpTermTaxonomy)
      .set({ description, parent })
      .where(and(eq(wpTermTaxonomy.termId, termId), eq(wpTermTaxonomy.taxonomy, "category")));
  });

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");
  redirect("/admincp/categories");
}

export async function quickUpdateCategory(data: {
  id: string;
  name: string;
  slug?: string;
}) {
  await verifyAdminOrEditor();
  const termId = BigInt(data.id);
  if (termId <= BigInt(0)) throw new Error("A valid category ID is required.");

  const name = data.name.trim();
  if (!name) throw new Error("Category name is required.");

  const slug = await uniqueCategorySlug(data.slug || name, termId);

  await db
    .update(wpTerms)
    .set({ name, slug })
    .where(eq(wpTerms.termId, termId));

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");
  return { success: true, id: data.id, name, slug };
}

export async function deleteCategories(ids: string[]) {
  await verifyAdminOrEditor();
  const termIds = ids.map((id) => BigInt(id)).filter((id) => id > BigInt(0));
  if (!termIds.length) return { error: "Select at least one category." };

  // Find default uncategorized term to prevent its deletion
  const uncategorized = await db
    .select({ termId: wpTerms.termId })
    .from(wpTerms)
    .where(eq(wpTerms.slug, "uncategorized"))
    .limit(1);

  const safeTermIds = termIds.filter(
    (id) => !uncategorized[0] || id !== uncategorized[0].termId,
  );

  if (!safeTermIds.length) {
    return { error: "The default category cannot be deleted." };
  }

  await db.transaction(async (tx) => {
    // Get taxonomy IDs for these terms
    const taxRows = await tx
      .select({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .where(and(eq(wpTermTaxonomy.taxonomy, "category"), inArray(wpTermTaxonomy.termId, safeTermIds)));

    const taxIds = taxRows.map((r) => r.termTaxonomyId);
    if (taxIds.length) {
      await tx.delete(wpTermRelationships).where(inArray(wpTermRelationships.termTaxonomyId, taxIds));
      await tx.delete(wpTermTaxonomy).where(inArray(wpTermTaxonomy.termTaxonomyId, taxIds));
    }
    await tx.delete(wpTerms).where(inArray(wpTerms.termId, safeTermIds));
  });

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");
  return { success: true };
}
