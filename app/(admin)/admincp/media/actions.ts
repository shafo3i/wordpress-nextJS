"use server";
import { mediaItemIdSchema, mediaDetailsPatchSchema, mediaListQuerySchema, mediaDeleteIdsSchema } from "@/db/schema/cms-media-details";
import { getMediaItemDetails } from "@/services/media-details.service";
import { getMediaLibraryItems, uploadMediaFile, updateMediaItem, deleteMediaItems, type MediaItem, type MediaListResult } from "@/services/media.service";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { verifyPostEditor } from "@/lib/authMIddleware";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { MAX_MEDIA_UPLOAD_BYTES, MAX_MEDIA_UPLOAD_FILES, MediaUploadError, validateMediaUpload } from "@/lib/media-upload";
async function message(key: string) { const { dict } = await getAdminLanguageContext(); return dict[key] || dict["admin.media.error_failed"] || ""; }
async function failure(error: unknown) {
  unstable_rethrow(error);
  const key = error instanceof MediaUploadError ? error.key : error instanceof Error && error.message === "admin.media.details_not_found" ? error.message : "admin.media.error_failed";
  return message(key);
}
export async function fetchMediaItemsAction(params: { type?: string; month?: string; search?: string; page?: number; perPage?: number }): Promise<{ success: boolean; data?: MediaListResult; error?: string }> {
  await verifyPostEditor();
  try { return { success: true, data: await getMediaLibraryItems(mediaListQuerySchema.parse(params)) }; }
  catch (error) { return { success: false, error: await failure(error) }; }
}
export async function uploadMediaAction(formData: FormData): Promise<{ success: boolean; items?: MediaItem[]; error?: string; warning?: string }> {
  const session = await verifyPostEditor();
  const uploaded: MediaItem[] = [];
  try {
    const files = formData.getAll("file");
    if (!files.length || files.length > MAX_MEDIA_UPLOAD_FILES || files.some(file => !(file instanceof File) || !file.size) || files.reduce((sum, file) => sum + (file instanceof File ? file.size : 0), 0) > MAX_MEDIA_UPLOAD_BYTES)
      throw new MediaUploadError("admin.media.invalid_upload");
    // Preflight every file's policy before writing any member of the batch.
    const pending: { file: File; bytes: Buffer }[] = [];
    for (const entry of files) {
      const file = entry as File, bytes = Buffer.from(await file.arrayBuffer());
      validateMediaUpload(file.name, file.type, bytes); pending.push({ file, bytes });
    }
    for (const { file, bytes } of pending) uploaded.push(await uploadMediaFile(bytes, file.name, file.type, session.user.id));
    revalidatePath("/admincp/media"); return { success: true, items: uploaded };
  } catch (error) {
    unstable_rethrow(error);
    if (uploaded.length) { revalidatePath("/admincp/media"); return { success: true, items: uploaded, warning: await message("admin.media.partial_upload") }; }
    return { success: false, error: await failure(error) };
  }
}
export async function updateMediaAction(id: number, data: { title?: string; altText?: string; caption?: string; description?: string }): Promise<{ success: boolean; item?: MediaItem; error?: string }> {
  await verifyPostEditor();
  try {
    mediaItemIdSchema.parse(id); await updateMediaItem(id, mediaDetailsPatchSchema.parse(data));
    revalidatePath("/", "layout"); return { success: true, item: (await getMediaItemDetails(id)) || undefined };
  } catch (error) { return { success: false, error: await failure(error) }; }
}
export async function deleteMediaAction(ids: number[]): Promise<{ success: boolean; deletedCount?: number; error?: string; warning?: string }> {
  await verifyPostEditor();
  try {
    const result = await deleteMediaItems(mediaDeleteIdsSchema.parse(ids));
    revalidatePath("/", "layout");
    return { success: true, deletedCount: result.deletedCount, ...(result.cleanupPending ? { warning: await message("admin.media.cleanup_pending") } : {}) };
  } catch (error) { return { success: false, error: await failure(error) }; }
}
export async function fetchMediaItemAction(id: number): Promise<{ success: boolean; item?: MediaItem; error?: string }> {
  await verifyPostEditor();
  try { mediaItemIdSchema.parse(id); const item = await getMediaItemDetails(id); return item ? { success: true, item } : { success: false, error: await message("admin.media.details_not_found") }; }
  catch (error) { return { success: false, error: await failure(error) }; }
}
