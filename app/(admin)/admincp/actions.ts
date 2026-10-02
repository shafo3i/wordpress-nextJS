"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { createPost } from "@/services/post.service";

export async function saveQuickDraftAction(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  postId?: string;
}> {
  try {
    const session = await verifyAdminOrEditor();
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (!title && !content) {
      return {
        success: false,
        error: "Please enter a title or some content for the draft.",
      };
    }

    const postId = await createPost({
      title: title || "Untitled Draft",
      content,
      status: "draft",
      authorId: session.user?.id,
    });

    revalidatePath("/admincp");
    revalidatePath("/admincp/posts");

    return {
      success: true,
      message: "Draft saved successfully.",
      postId,
    };
  } catch (error: any) {
    console.error("saveQuickDraftAction error:", error);
    return {
      success: false,
      error: error?.message || "Failed to save draft.",
    };
  }
}
