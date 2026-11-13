"use server";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/lib/authMIddleware";
import { createPost } from "@/services/post.service";
import { quickDraftSchema } from "@/db/schema/cms-dashboard";
import { escapeMediaHtml } from "@/lib/post-media";

export async function saveQuickDraftAction(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  postId?: string;
}> {
  const session = await verifyAdmin();
  const parsed = quickDraftSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success)
    return { success: false, error: "admin.dashboard.draft_invalid" };
  try {
    const { title, content } = parsed.data;
    const postId = await createPost({
      title,
      content: escapeMediaHtml(content).replace(/\r?\n/g, "<br>"),
      status: "draft",
      authorId: session.user.id,
    });
    revalidatePath("/admincp");
    revalidatePath("/admincp/posts");
    return { success: true, message: "admin.dashboard.draft_saved", postId };
  } catch {
    return { success: false, error: "admin.dashboard.draft_error" };
  }
}
