"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  CategoryMutationError,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  quickUpdateCategory as quickUpdateCategoryService,
  bulkDeleteCategories as bulkDeleteCategoriesService,
} from "@/services/category.service";
import {
  createCategorySchema,
  updateCategorySchema,
  quickUpdateCategorySchema,
  deleteCategoriesSchema,
} from "@/db/schema/cms-taxonomy";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { ZodError } from "zod";

async function categoryErrorMessage(error: unknown): Promise<string> {
  unstable_rethrow(error);
  const { dict } = await getAdminLanguageContext();
  const key =
    error instanceof CategoryMutationError
      ? error.key
      : error instanceof ZodError
        ? "admin.categories.error.invalid"
        : "admin.categories.error.failed";
  return dict[key] || dict["admin.categories.error.failed"] || "";
}
async function categoryMutation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new Error(await categoryErrorMessage(error));
  }
}

export async function createCategory(formData: FormData) {
  await verifyAdminOrEditor();

  const category = await categoryMutation(async () =>
    createCategoryService(
      createCategorySchema.parse(Object.fromEntries(formData.entries()))
    )
  );

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");
  return { success: true, id: category.id };
}

export async function updateCategory(formData: FormData) {
  await verifyAdminOrEditor();

  await categoryMutation(async () => {
    const parsed = updateCategorySchema.parse(
      Object.fromEntries(formData.entries())
    );
    return updateCategoryService(parsed.termId, parsed);
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

  const result = await categoryMutation(async () => {
    const parsed = quickUpdateCategorySchema.parse(data);
    return quickUpdateCategoryService(parsed.id, parsed);
  });

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");
  return { success: true, ...result };
}

export async function deleteCategories(
  ids: string[]
): Promise<{ success?: boolean; count?: number; error?: string }> {
  await verifyAdminOrEditor();

  let res;
  try {
    res = await bulkDeleteCategoriesService(deleteCategoriesSchema.parse(ids));
  } catch (error) {
    return { error: await categoryErrorMessage(error) };
  }

  revalidatePath("/admincp/categories");
  revalidatePath("/admincp/posts");

  return { success: true, count: res.count };
}

// Aliases for compatibility
export const createCategoryAction = createCategory;
export const updateCategoryAction = updateCategory;
export const quickUpdateCategoryAction = quickUpdateCategory;
export const deleteCategoriesAction = deleteCategories;
