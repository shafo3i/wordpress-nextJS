"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  createPage as createPageService,
  updatePage as updatePageService,
  quickUpdatePage as quickUpdatePageService,
  trashPages as trashPagesService,
  restorePages as restorePagesService,
  deletePages as deletePagesService,
  QuickUpdatePageInput,
} from "@/services/page.service";

const quickUpdateSchema = z.object({
  id: z.string().min(1, "Page ID is required"),
  title: z.string().trim().min(1, "Page title is required"),
  slug: z.string().trim().optional(),
  date: z.string().optional(),
  status: z.enum(["publish", "draft", "pending", "private", "trash"]).optional(),
  postParent: z.union([z.string(), z.number()]).optional(),
  menuOrder: z.coerce.number().optional(),
  commentStatus: z.enum(["open", "closed"]).optional(),
  postPassword: z.string().optional(),
});

function parsePageFormData(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "");
  const status = String(formData.get("status") ?? "publish");
  const commentStatus = (String(formData.get("commentStatus") ?? "closed") === "open" ? "open" : "closed") as "open" | "closed";
  const pingStatus = (String(formData.get("pingStatus") ?? "closed") === "open" ? "open" : "closed") as "open" | "closed";
  const postParent = String(formData.get("postParent") ?? "0");
  const menuOrder = Number(formData.get("menuOrder") ?? 0) || 0;
  const postPassword = String(formData.get("postPassword") ?? "");
  const featuredImageId = String(formData.get("featuredImageId") ?? "");
  const template = String(formData.get("pageTemplate") ?? "default");
  const languageCode = String(formData.get("languageCode") ?? "").trim() || undefined;
  const translationOf = String(formData.get("translationOf") ?? "").trim() || undefined;

  return {
    title,
    content,
    excerpt,
    status,
    commentStatus,
    pingStatus,
    postParent,
    menuOrder,
    postPassword,
    featuredImageId,
    template,
    languageCode,
    translationOf,
  };
}

export async function savePageAction(formData: FormData) {
  const session = await verifyAdminOrEditor();
  const parsed = parsePageFormData(formData);

  if (!parsed.title) {
    throw new Error("Page title is required.");
  }

  await createPageService({
    ...parsed,
    userId: session?.user?.id,
  });

  revalidatePath("/admincp");
  revalidatePath("/admincp/pages");
  revalidatePath("/", "layout");
  redirect("/admincp/pages");
}

export async function updatePageAction(formData: FormData) {
  await verifyAdminOrEditor();
  const pageId = String(formData.get("id") ?? "");
  if (!pageId || pageId === "0") {
    throw new Error("A valid page ID is required.");
  }

  const parsed = parsePageFormData(formData);
  if (!parsed.title) {
    throw new Error("Page title is required.");
  }

  await updatePageService(pageId, {
    id: pageId,
    ...parsed,
  });

  revalidatePath("/admincp");
  revalidatePath("/admincp/pages");
  revalidatePath("/", "layout");
  redirect("/admincp/pages");
}

export async function quickUpdatePageAction(data: QuickUpdatePageInput) {
  try {
    await verifyAdminOrEditor();
    const validated = quickUpdateSchema.parse(data);

    const result = await quickUpdatePageService(validated);

    revalidatePath("/admincp");
    revalidatePath("/admincp/pages");
    revalidatePath("/", "layout");

    return { success: true, ...result };
  } catch (error: any) {
    console.error("Failed to quick update page:", error);
    return { success: false, error: error?.message || "Failed to update page." };
  }
}

export async function movePagesToTrashAction(ids: string[]) {
  try {
    await verifyAdminOrEditor();
    if (!ids.length) return { success: false, error: "No page IDs provided." };

    await trashPagesService(ids);

    revalidatePath("/admincp");
    revalidatePath("/admincp/pages");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to trash pages:", error);
    return { success: false, error: error?.message || "Failed to trash pages." };
  }
}

export async function restorePagesAction(ids: string[]) {
  try {
    await verifyAdminOrEditor();
    if (!ids.length) return { success: false, error: "No page IDs provided." };

    await restorePagesService(ids);

    revalidatePath("/admincp");
    revalidatePath("/admincp/pages");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to restore pages:", error);
    return { success: false, error: error?.message || "Failed to restore pages." };
  }
}

export async function deletePagesPermanentlyAction(ids: string[]) {
  try {
    await verifyAdminOrEditor();
    if (!ids.length) return { success: false, error: "No page IDs provided." };

    await deletePagesService(ids);

    revalidatePath("/admincp");
    revalidatePath("/admincp/pages");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete pages:", error);
    return { success: false, error: error?.message || "Failed to delete pages." };
  }
}

// Aliases for seamless backward compatibility
export const savePage = savePageAction;
export const updatePage = updatePageAction;
export const quickUpdatePage_alias = quickUpdatePageAction;
export const movePostsToTrash = movePagesToTrashAction;
export const restorePosts = restorePagesAction;
export const deletePosts = deletePagesPermanentlyAction;
