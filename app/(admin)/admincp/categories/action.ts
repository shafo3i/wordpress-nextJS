"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  categoryService,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  quickUpdateCategory as quickUpdateCategoryService,
  bulkDeleteCategories as bulkDeleteCategoriesService,
} from "@/services/category.service";
import { createCategorySchema, updateCategorySchema } from "@/db/schema/cms-taxonomy";

export async function createCategory(formData: FormData) {
  await verifyAdminOrEditor();

  const raw = Object.fromEntries(formData.entries());
  const parsed = createCategorySchema.parse(raw);

  const category = await createCategoryService(parsed);

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");
  return { success: true, category };
}

export async function updateCategory(formData: FormData) {
  await verifyAdminOrEditor();

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateCategorySchema.parse(raw);

  if (!parsed.termId) {
    throw new Error("A valid category ID is required.");
  }

  await updateCategoryService(parsed.termId, {
    name: parsed.name,
    slug: parsed.slug,
    parent: parsed.parent,
    description: parsed.description,
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
  if (termId <= BigInt(0)) {
    throw new Error("A valid category ID is required.");
  }

  const result = await quickUpdateCategoryService(termId, {
    name: data.name,
    slug: data.slug,
  });

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");
  return { success: true, ...result };
}

export async function deleteCategories(ids: string[]) {
  await verifyAdminOrEditor();

  const res = await bulkDeleteCategoriesService(ids);

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");

  if (!res.success) {
    return { error: res.error || "Failed to delete category." };
  }

  return { success: true, count: res.count };
}

// Aliases for compatibility
export const createCategoryAction = createCategory;
export const updateCategoryAction = updateCategory;
export const quickUpdateCategoryAction = quickUpdateCategory;
export const deleteCategoriesAction = deleteCategories;
