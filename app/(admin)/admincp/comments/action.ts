"use server";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { verifyAdmin } from "@/lib/authMIddleware";
import { commentService, CommentMutationError } from "@/services/comment.service";
import { createCommentSchema, updateCommentSchema, commentIdSchema, commentStatusMutationSchema, commentIdsSchema } from "@/db/schema/cms-comments";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { ZodError } from "zod";
async function mutation<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); }
  catch (error) {
    unstable_rethrow(error);
    const { dict } = await getAdminLanguageContext();
    const key = error instanceof CommentMutationError ? error.key : error instanceof ZodError ? "admin.comments.error.invalid" : "admin.comments.error.failed";
    throw new Error(dict[key] || dict["admin.comments.error.failed"] || "");
  }
}
function idFrom(form: FormData) { return commentIdSchema.parse(form.get("commentId") || form.get("id")); }
export async function createCommentAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => commentService.create(createCommentSchema.parse(Object.fromEntries(formData))));
  revalidatePath("/admincp/comments");
  redirect("/admincp/comments");
}
export async function updateCommentAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => commentService.update(idFrom(formData), updateCommentSchema.parse(Object.fromEntries(formData))));
  revalidatePath("/admincp/comments");
  redirect("/admincp/comments");
}
export async function deleteCommentAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => commentService.delete(idFrom(formData)));
  revalidatePath("/admincp/comments");
  redirect("/admincp/comments");
}
export async function updateCommentStatusAction(formData: FormData) {
  await verifyAdmin();
  await mutation(() => {
    const data = commentStatusMutationSchema.parse({ id: idFrom(formData), status: formData.get("status") });
    return commentService.bulkUpdateStatus([data.id], data.status);
  });
  revalidatePath("/admincp/comments");
}
export async function bulkUpdateCommentStatus(ids: string[], status: "1" | "0" | "spam" | "trash") {
  await verifyAdmin();
  const result = await mutation(() => commentService.bulkUpdateStatus(commentIdsSchema.parse(ids), status));
  revalidatePath("/admincp/comments");
  return result;
}
export async function bulkDeleteComments(ids: string[]) {
  await verifyAdmin();
  const result = await mutation(() => commentService.bulkDelete(commentIdsSchema.parse(ids)));
  revalidatePath("/admincp/comments");
  return result;
}
