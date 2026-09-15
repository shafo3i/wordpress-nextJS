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

async function uniqueTagSlug(title: string, termId?: bigint) {
  const base = toSlug(title) || `tag-${Date.now()}`;
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

export async function createTag(formData: FormData) {
  await verifyAdminOrEditor();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Tag name is required.");

  const customSlug = String(formData.get("slug") ?? "").trim();
  const slug = await uniqueTagSlug(customSlug || name);
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
      taxonomy: "post_tag",
      description,
      parent: BigInt(0),
      count: BigInt(0),
    });
  });

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  return { success: true };
}

export async function updateTag(formData: FormData) {
  await verifyAdminOrEditor();
  const termId = BigInt(String(formData.get("termId") ?? "0"));
  if (termId <= BigInt(0)) throw new Error("A valid tag ID is required.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Tag name is required.");

  const customSlug = String(formData.get("slug") ?? "").trim();
  const slug = await uniqueTagSlug(customSlug || name, termId);
  const description = String(formData.get("description") ?? "").trim();

  await db.transaction(async (tx) => {
    await tx
      .update(wpTerms)
      .set({ name, slug })
      .where(eq(wpTerms.termId, termId));

    await tx
      .update(wpTermTaxonomy)
      .set({ description })
      .where(and(eq(wpTermTaxonomy.termId, termId), eq(wpTermTaxonomy.taxonomy, "post_tag")));
  });

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  redirect("/admincp/tags");
}

export async function quickUpdateTag(data: {
  id: string;
  name: string;
  slug?: string;
}) {
  await verifyAdminOrEditor();
  const termId = BigInt(data.id);
  if (termId <= BigInt(0)) throw new Error("A valid tag ID is required.");

  const name = data.name.trim();
  if (!name) throw new Error("Tag name is required.");

  const slug = await uniqueTagSlug(data.slug || name, termId);

  await db
    .update(wpTerms)
    .set({ name, slug })
    .where(eq(wpTerms.termId, termId));

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  return { success: true, id: data.id, name, slug };
}

export async function deleteTags(ids: string[]) {
  await verifyAdminOrEditor();
  const termIds = ids.map((id) => BigInt(id)).filter((id) => id > BigInt(0));
  if (!termIds.length) return { error: "Select at least one tag." };

  await db.transaction(async (tx) => {
    const taxRows = await tx
      .select({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .where(and(eq(wpTermTaxonomy.taxonomy, "post_tag"), inArray(wpTermTaxonomy.termId, termIds)));

    const taxIds = taxRows.map((r) => r.termTaxonomyId);
    if (taxIds.length) {
      await tx.delete(wpTermRelationships).where(inArray(wpTermRelationships.termTaxonomyId, taxIds));
      await tx.delete(wpTermTaxonomy).where(inArray(wpTermTaxonomy.termTaxonomyId, taxIds));
    }
    await tx.delete(wpTerms).where(inArray(wpTerms.termId, termIds));
  });

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  return { success: true };
}
