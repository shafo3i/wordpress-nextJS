import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getAllCategories as getCategoriesFromService,
  getCategoryCounts as getCountsFromService,
  getParentCategories as getParentsFromService,
  getCategoryById as getCategoryByIdFromService,
  GetCategoriesOptions,
  CategoryItem,
  CategoryCounts,
} from "@/services/category.service";

export type { CategoryItem, CategoryCounts };

export async function getCategories(
  options: GetCategoriesOptions = {}
): Promise<{ categories: CategoryItem[]; total: number }> {
  await verifyAdminOrEditor();
  return getCategoriesFromService(options);
}

export async function getCategoryCounts(): Promise<CategoryCounts> {
  await verifyAdminOrEditor();
  return getCountsFromService();
}

export async function getParentCategories(
  excludeTermId?: bigint | string | number
): Promise<{ id: string; name: string; parent: string }[]> {
  await verifyAdminOrEditor();
  return getParentsFromService(excludeTermId);
}

export async function getCategoryById(
  id: bigint | string | number
): Promise<CategoryItem | null> {
  await verifyAdminOrEditor();
  return getCategoryByIdFromService(id);
}
