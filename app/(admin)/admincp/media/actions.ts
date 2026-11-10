"use server";

import { mediaItemIdSchema, mediaDetailsPatchSchema } from "@/db/schema/cms-media-details";
import { getMediaItemDetails } from "@/services/media-details.service";
import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { MAX_MEDIA_UPLOAD_BYTES } from "@/lib/media-upload";
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
    if (files.some(file => !(file instanceof File)) || files.reduce((sum, file) => sum + file.size, 0) > MAX_MEDIA_UPLOAD_BYTES) {
      return { success: false, error: "Invalid upload or upload exceeds 32 MB" };
    }

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
): Promise<{ success: boolean; item?: MediaItem; error?: string }> {
  try {
    await verifyAdminOrEditor();
    mediaItemIdSchema.parse(id);
    await updateMediaItem(id, mediaDetailsPatchSchema.parse(data));
    revalidatePath("/admincp/media");
    revalidatePath("/", "layout");
    return { success: true, item: (await getMediaItemDetails(id)) || undefined };
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

export async function fetchMediaItemAction(id:number):Promise<{success:boolean;item?:MediaItem;error?:string}>{
  try { await verifyAdminOrEditor(); mediaItemIdSchema.parse(id); const item=await getMediaItemDetails(id);return item?{success:true,item}:{success:false,error:"admin.media.details_not_found"}; }
  catch { return {success:false,error:"admin.media.details_load_failed"}; }
}
