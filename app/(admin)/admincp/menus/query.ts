import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getAllMenus as getAllMenusService,
  getMenuById as getMenuByIdService,
  getPublishedPagesForMenu as getPagesService,
  getCategoriesForMenu as getCategoriesService,
  getPublishedPostsForMenu as getPostsService,
  GetMenusOptions,
} from "@/services/menu.service";
import { Menu, MenuItem, MenuLocation } from "@/lib/menus/types";

export type { Menu, MenuItem, MenuLocation };

export async function getMenus(
  options: GetMenusOptions = {}
): Promise<{ id: string; name: string; slug: string; language?: string }[]> {
  await verifyAdminOrEditor();
  return getAllMenusService(options);
}

export async function getMenu(
  menuId: string | number | bigint
): Promise<Menu | null> {
  await verifyAdminOrEditor();
  return getMenuByIdService(menuId);
}

export async function getMenuAvailableItems(options: { language?: string } = {}) {
  await verifyAdminOrEditor();
  const [pages, categories, posts] = await Promise.all([
    getPagesService(options),
    getCategoriesService(options),
    getPostsService(options),
  ]);

  return { pages, categories, posts };
}
