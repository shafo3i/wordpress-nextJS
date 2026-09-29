"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { commentService } from "@/services/comment.service";
import { createCommentSchema } from "@/db/schema/cms-comments";

export async function createCommentAction(formData: FormData) {
    const session = await verifyAdminOrEditor();

    const raw = Object.fromEntries(formData);
    const data = createCommentSchema.parse({
        ...raw,
        userId: session.user.id,
    });

    await commentService.create(data);

    revalidatePath("/admincp/comments");
    redirect("/admincp/comments");
}

export async function updateCommentAction(formData: FormData) {
    await verifyAdminOrEditor();

    const id = formData.get("commentId") || formData.get("id");
    if (!id) {
        throw new Error("Comment ID is required to update");
    }

    const raw = Object.fromEntries(formData);
    const data = createCommentSchema.partial().parse(raw);

    await commentService.update(id.toString(), data);

    revalidatePath("/admincp/comments");
    redirect("/admincp/comments");
}

export async function deleteCommentAction(formData: FormData) {
    await verifyAdminOrEditor();

    const id = formData.get("commentId") || formData.get("id");
    if (!id) {
        throw new Error("Comment ID is required to delete");
    }

    await commentService.delete(id.toString());

    revalidatePath("/admincp/comments");
    redirect("/admincp/comments");
}

export async function updateCommentStatusAction(formData: FormData) {
    await verifyAdminOrEditor();

    const id = formData.get("commentId") || formData.get("id");
    const status = formData.get("status")?.toString();

    if (!id || !status) {
        throw new Error("Comment ID and target status are required");
    }

    await commentService.updateStatus(id.toString(), status as "1" | "0" | "spam" | "trash" | "pending");

    revalidatePath("/admincp/comments");
}

export async function bulkUpdateCommentStatus(
    ids: string[],
    status: "1" | "0" | "spam" | "trash"
) {
    await verifyAdminOrEditor();

    const commentIds = ids.map((id) => BigInt(id)).filter((id) => id > BigInt(0));
    if (!commentIds.length) {
        return { error: "Select at least one comment." };
    }

    const { db } = await import("@/db");
    const { inArray } = await import("drizzle-orm");
    const { wpComments } = await import("@/db/schema/cms-comments");
    const { syncPostCommentCount } = await import("@/services/comment.service");

    const affected = await db
        .select({ postId: wpComments.commentPostId })
        .from(wpComments)
        .where(inArray(wpComments.commentId, commentIds));

    await db
        .update(wpComments)
        .set({ commentApproved: status })
        .where(inArray(wpComments.commentId, commentIds));

    const uniquePostIds = [...new Set(affected.map((a) => a.postId).filter(Boolean))];
    for (const pId of uniquePostIds) {
        if (pId) await syncPostCommentCount(pId);
    }

    revalidatePath("/admincp/comments");
    return { success: true };
}

export async function bulkDeleteComments(ids: string[]) {
    await verifyAdminOrEditor();

    const commentIds = ids.map((id) => BigInt(id)).filter((id) => id > BigInt(0));
    if (!commentIds.length) {
        return { error: "Select at least one comment." };
    }

    const { db } = await import("@/db");
    const { inArray } = await import("drizzle-orm");
    const { wpComments } = await import("@/db/schema/cms-comments");
    const { syncPostCommentCount } = await import("@/services/comment.service");

    const affected = await db
        .select({ postId: wpComments.commentPostId })
        .from(wpComments)
        .where(inArray(wpComments.commentId, commentIds));

    await db
        .delete(wpComments)
        .where(inArray(wpComments.commentId, commentIds));

    const uniquePostIds = [...new Set(affected.map((a) => a.postId).filter(Boolean))];
    for (const pId of uniquePostIds) {
        if (pId) await syncPostCommentCount(pId);
    }

    revalidatePath("/admincp/comments");
    return { success: true };
}