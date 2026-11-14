"use server";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { verifyAdmin } from "@/lib/authMIddleware";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { createPageSchema, updatePageSchema, quickUpdatePageSchema, pageIdsSchema } from "@/db/schema/cms-pages";
import { createPage as createPageService, updatePage as updatePageService, quickUpdatePage as quickUpdatePageService,
  trashPages, restorePages, deletePages, PageMutationError, type QuickUpdatePageInput } from "@/services/page.service";

function safeErrorKey(error: unknown) {
  unstable_rethrow(error);
  const key = error instanceof PageMutationError ? error.key : error instanceof ZodError ? "invalid" : "failed";
  return `admin.pages.error.${key}`;
}
async function safeError(error: unknown) {
  const key = safeErrorKey(error);
  const { dict } = await getAdminLanguageContext();
  return dict[key] || dict["admin.pages.error.failed"] || "";
}
function invalidatePages() {
  revalidatePath("/admincp");
  revalidatePath("/admincp/pages");
  revalidatePath("/", "layout");
}
function formInput(form: FormData) {
  const input = Object.fromEntries(form);
  return { ...input, ...(form.has("pageTemplate") ? { template: form.get("pageTemplate") } : {}) };
}
export async function savePageAction(formData: FormData) {
  await verifyAdmin();
  try { await createPageService(createPageSchema.parse(formInput(formData))); }
  catch (error) { return { success: false as const, error: safeErrorKey(error) }; }
  invalidatePages();
  redirect("/admincp/pages");
}
export async function updatePageAction(formData: FormData) {
  await verifyAdmin();
  try {
    const input = updatePageSchema.parse(formInput(formData));
    await updatePageService(input.id, input);
  } catch (error) { return { success: false as const, error: safeErrorKey(error) }; }
  invalidatePages();
  redirect("/admincp/pages");
}
export async function quickUpdatePageAction(data: QuickUpdatePageInput) {
  await verifyAdmin();
  try {
    const result = await quickUpdatePageService(quickUpdatePageSchema.parse(data));
    invalidatePages();
    return { success: true, ...result };
  } catch (error) { return { success: false, error: await safeError(error) }; }
}
async function bulk(ids: string[], operation: (ids: bigint[]) => Promise<void>) {
  await verifyAdmin();
  try {
    await operation(pageIdsSchema.parse(ids));
    invalidatePages();
    return { success: true };
  } catch (error) { return { success: false, error: await safeError(error) }; }
}
export async function movePagesToTrashAction(ids: string[]) { return bulk(ids, trashPages); }
export async function restorePagesAction(ids: string[]) { return bulk(ids, restorePages); }
export async function deletePagesPermanentlyAction(ids: string[]) { return bulk(ids, deletePages); }
export const savePage = savePageAction;
export const updatePage = updatePageAction;
export const quickUpdatePage_alias = quickUpdatePageAction;
export const movePostsToTrash = movePagesToTrashAction;
export const restorePosts = restorePagesAction;
export const deletePosts = deletePagesPermanentlyAction;
