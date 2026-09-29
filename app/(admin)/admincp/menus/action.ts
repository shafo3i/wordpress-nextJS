"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  createMenu as createMenuService,
  deleteMenu as deleteMenuService,
  saveMenu as saveMenuService,
  MenuItemInput,
} from "@/services/menu.service";

const saveMenuSchema = z.object({
  menuId: z.string().min(1, "Menu ID is required"),
  menuName: z.string().trim().min(1, "Menu name is required").max(200),
  items: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().trim().min(1, "Item label is required"),
      url: z.string().trim().min(1, "Item URL is required"),
      order: z.number().int().default(0),
      target: z.string().optional(),
      type: z.enum(["page", "category", "custom", "post"]).optional(),
    })
  ),
  locations: z.array(z.string()),
  language: z.string().optional(),
});

const createMenuSchema = z.union([
  z.string().trim().min(1, "Menu name is required").max(200),
  z.object({
    name: z.string().trim().min(1, "Menu name is required").max(200),
    slug: z.string().trim().optional(),
    language: z.string().optional(),
  }),
]);

export async function saveMenuAction(
  menuId: string,
  menuName: string,
  items: MenuItemInput[],
  locations: string[],
  language?: string
) {
  try {
    await verifyAdminOrEditor();

    const parsed = saveMenuSchema.parse({
      menuId,
      menuName,
      items,
      locations,
      language,
    });

    await saveMenuService(
      parsed.menuId,
      parsed.menuName,
      parsed.items,
      parsed.locations,
      parsed.language
    );

    revalidatePath("/admincp/menus");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save menu:", error);
    return {
      success: false,
      error: error?.message || "Failed to save menu.",
    };
  }
}

export async function createMenuAction(
  input: string | { name: string; slug?: string; language?: string }
) {
  try {
    await verifyAdminOrEditor();

    const parsed = createMenuSchema.parse(input);
    const id = await createMenuService(parsed);

    revalidatePath("/admincp/menus");
    return { success: true, menuId: id };
  } catch (error: any) {
    console.error("Failed to create menu:", error);
    return {
      success: false,
      error: error?.message || "Failed to create menu.",
    };
  }
}

export async function deleteMenuAction(menuId: string) {
  try {
    await verifyAdminOrEditor();

    if (!menuId || !menuId.trim()) {
      return { success: false, error: "Menu ID is required." };
    }

    await deleteMenuService(menuId);

    revalidatePath("/admincp/menus");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete menu:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete menu.",
    };
  }
}

// Aliases
export const saveMenu = saveMenuAction;
export const createMenu = createMenuAction;
export const deleteMenu = deleteMenuAction;
