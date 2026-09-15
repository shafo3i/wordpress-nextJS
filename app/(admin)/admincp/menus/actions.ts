"use server";

import { revalidatePath } from "next/cache";
import { createMenu, deleteMenu, saveMenu } from "@/lib/menus/db";

export async function saveMenuAction(
  menuId: string,
  menuName: string,
  items: { id?: string; title: string; url: string; order: number }[],
  locations: string[]
) {
  try {
    await saveMenu(menuId, menuName, items, locations);
    revalidatePath("/admincp/menus");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to save menu:", error);
    return { error: "Failed to save menu." };
  }
}

export async function createMenuAction(name: string) {
  try {
    const id = await createMenu(name);
    revalidatePath("/admincp/menus");
    return { success: true, menuId: id };
  } catch (error) {
    console.error("Failed to create menu:", error);
    return { error: "Failed to create menu." };
  }
}

export async function deleteMenuAction(menuId: string) {
  try {
    await deleteMenu(menuId);
    revalidatePath("/admincp/menus");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete menu:", error);
    return { error: "Failed to delete menu." };
  }
}
