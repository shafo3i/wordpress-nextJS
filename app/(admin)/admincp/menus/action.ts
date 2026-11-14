"use server"
import { revalidatePath } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { verifyAdmin } from "@/lib/authMIddleware"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"
import {
  createMenu as createMenuService,
  deleteMenu as deleteMenuService,
  saveMenu as saveMenuService,
  type MenuItemInput,
} from "@/services/menu.service"
async function failure(error: unknown) {
  unstable_rethrow(error)
  const { dict } = await getAdminLanguageContext()
  return {
    success: false as const,
    menuId: undefined,
    error: dict["admin.menus.failed_notice"] || "",
  }
}
export async function saveMenuAction(
  menuId: string,
  menuName: string,
  items: MenuItemInput[],
  locations: string[],
  language?: string
) {
  await verifyAdmin()
  try {
    await saveMenuService(menuId, menuName, items, locations, language)
    revalidatePath("/admincp/menus")
    revalidatePath("/", "layout")
    return { success: true as const, error: undefined }
  } catch (error) {
    return failure(error)
  }
}
export async function createMenuAction(
  input: string | { name: string; slug?: string; language?: string }
) {
  await verifyAdmin()
  try {
    const menuId = await createMenuService(input)
    revalidatePath("/admincp/menus")
    return { success: true as const, error: undefined, menuId }
  } catch (error) {
    return failure(error)
  }
}
export async function deleteMenuAction(menuId: string) {
  await verifyAdmin()
  try {
    await deleteMenuService(menuId)
    revalidatePath("/admincp/menus")
    revalidatePath("/", "layout")
    return { success: true as const, error: undefined }
  } catch (error) {
    return failure(error)
  }
}
export const saveMenu = saveMenuAction
export const createMenu = createMenuAction
export const deleteMenu = deleteMenuAction
