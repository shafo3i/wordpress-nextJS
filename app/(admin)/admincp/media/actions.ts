"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getMediaLibraryItems,
  uploadMediaFile,
  updateMediaItem,
  deleteMediaItems,
  type MediaItem,
  type MediaListResult,
} from "@/services/media.service";

export async function fetchMediaItemsAction(params: {
  type?: string;
  month?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<{ success: boolean; data?: MediaListResult; error?: string }> {
  try {
    await verifyAdminOrEditor();
    const data = await getMediaLibraryItems(params);
    return { success: true, data };
  } catch (error: any) {
    console.error("fetchMediaItemsAction error:", error);
    return { success: false, error: error?.message || "Failed to fetch media items" };
  }
}

export async function uploadMediaAction(
  formData: FormData
): Promise<{ success: boolean; items?: MediaItem[]; error?: string }> {
  try {
    const session = await verifyAdminOrEditor();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return { success: false, error: "No files uploaded" };
    }

    const uploadedItems: MediaItem[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "application/octet-stream";

      const item = await uploadMediaFile(
        buffer,
        file.name,
        mimeType,
        session.user?.id
      );
      uploadedItems.push(item);
    }

    revalidatePath("/admincp/media");
    return { success: true, items: uploadedItems };
  } catch (error: any) {
    console.error("uploadMediaAction error:", error);
    return { success: false, error: error?.message || "Failed to upload media" };
  }
}

export async function updateMediaAction(
  id: number,
  data: {
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await verifyAdminOrEditor();
    await updateMediaItem(id, data);
    revalidatePath("/admincp/media");
    return { success: true };
  } catch (error: any) {
    console.error("updateMediaAction error:", error);
    return { success: false, error: error?.message || "Failed to update media item" };
  }
}

export async function deleteMediaAction(
  ids: number[]
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    await verifyAdminOrEditor();
    const result = await deleteMediaItems(ids);
    revalidatePath("/admincp/media");
    return { success: true, deletedCount: result.deletedCount };
  } catch (error: any) {
    console.error("deleteMediaAction error:", error);
    return { success: false, error: error?.message || "Failed to delete media" };
  }
}
