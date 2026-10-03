"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  tagService,
  createTag as createTagService,
  updateTag as updateTagService,
  quickUpdateTag as quickUpdateTagService,
  bulkDeleteTags as bulkDeleteTagsService,
} from "@/services/tag.service";
import { createTagSchema, updateTagSchema } from "@/db/schema/cms-taxonomy";

export async function createTag(formData: FormData) {
  await verifyAdminOrEditor();

  const raw = Object.fromEntries(formData.entries());
  const parsed = createTagSchema.parse(raw);
  const languageCode = typeof raw.languageCode === "string" && raw.languageCode.trim() ? raw.languageCode.trim() : undefined;
  const sourceTermTaxonomyId = raw.sourceTermTaxonomyId && String(raw.sourceTermTaxonomyId) !== "0" ? String(raw.sourceTermTaxonomyId) : undefined;

  const tag = await createTagService({
    ...parsed,
    languageCode,
    sourceTermTaxonomyId,
  });

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  return { success: true, tag };
}

export async function updateTag(formData: FormData) {
  await verifyAdminOrEditor();

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateTagSchema.parse(raw);

  if (!parsed.termId) {
    throw new Error("A valid tag ID is required.");
  }

  const languageCode = typeof raw.languageCode === "string" && raw.languageCode.trim() ? raw.languageCode.trim() : undefined;
  const sourceTermTaxonomyId = raw.sourceTermTaxonomyId && String(raw.sourceTermTaxonomyId) !== "0" ? String(raw.sourceTermTaxonomyId) : undefined;

  await updateTagService(parsed.termId, {
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description,
    languageCode,
    sourceTermTaxonomyId,
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
  if (termId <= BigInt(0)) {
    throw new Error("A valid tag ID is required.");
  }

  const result = await quickUpdateTagService(termId, {
    name: data.name,
    slug: data.slug,
  });

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  return { success: true, ...result };
}

export async function deleteTags(ids: string[]) {
  await verifyAdminOrEditor();

  const res = await bulkDeleteTagsService(ids);

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");

  if (!res.success) {
    return { error: res.error || "Failed to delete tag." };
  }

  return { success: true, count: res.count };
}

// Aliases for compatibility
export const createTagAction = createTag;
export const updateTagAction = updateTag;
export const quickUpdateTagAction = quickUpdateTag;
export const deleteTagsAction = deleteTags;
