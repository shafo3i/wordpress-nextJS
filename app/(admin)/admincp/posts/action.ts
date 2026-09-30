"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  createPost as createPostService,
  updatePost as updatePostService,
  trashPosts as trashPostsService,
  restorePosts as restorePostsService,
  deletePosts as deletePostsService,
} from "@/services/post.service";

const VALID_STATUSES = new Set(["draft", "publish", "pending", "private", "trash"]);

const quickUpdateSchema = z.object({
  id: z.string().min(1, "Post ID is required"),
  title: z.string().trim().min(1, "Post title is required"),
  slug: z.string().trim().optional(),
  date: z.string().optional(),
  status: z.string().optional(),
  commentStatus: z.enum(["open", "closed"]).optional(),
  pingStatus: z.enum(["open", "closed"]).optional(),
  postPassword: z.string().optional(),
  categorySlugs: z.array(z.string()).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
});

export type QuickUpdatePostInput = z.infer<typeof quickUpdateSchema>;

function parsePostFormData(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const requestedStatus = String(formData.get("status") ?? "draft");
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : "draft";

  const commentStatus =
    (String(formData.get("commentStatus") ?? "open") === "closed" ? "closed" : "open") as
      | "open"
      | "closed";
  const pingStatus =
    (String(formData.get("pingStatus") ?? "open") === "closed" ? "closed" : "open") as
      | "open"
      | "closed";

  const postPassword = String(formData.get("postPassword") ?? "");
  const featuredImageId = String(formData.get("featuredImageId") ?? "").trim();

  const categorySlugs = String(formData.get("categorySlugs") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const languageCode = String(formData.get("languageCode") ?? "").trim() || "en";
  const translationOf = String(formData.get("translationOf") ?? "").trim() || undefined;

  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const seoOgImage = String(formData.get("seoOgImage") ?? "").trim();
  const seoNoindex = formData.get("seoNoindex") === "1";
  const seoCanonical = String(formData.get("seoCanonical") ?? "").trim();

  return {
    title,
    content,
    excerpt,
    status,
    commentStatus,
    pingStatus,
    postPassword,
    featuredImageId,
    categorySlugs,
    tags,
    languageCode,
    translationOf,
    seo: {
      seoTitle,
      seoDescription,
      seoOgImage,
      seoNoindex,
      seoCanonical,
    },
  };
}

export async function savePostAction(formData: FormData) {
  const session = await verifyAdminOrEditor();
  const parsed = parsePostFormData(formData);

  if (!parsed.title) {
    throw new Error("A post title is required.");
  }

  await createPostService({
    ...parsed,
    authorId: session?.user?.id,
  });

  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  revalidatePath("/", "layout");
  redirect("/admincp/posts");
}

export async function updatePostAction(formData: FormData) {
  await verifyAdminOrEditor();
  const postId = String(formData.get("id") ?? "");
  if (!postId || postId === "0") {
    throw new Error("A valid post ID is required.");
  }

  const parsed = parsePostFormData(formData);
  if (!parsed.title) {
    throw new Error("A post title is required.");
  }

  await updatePostService(postId, parsed);

  revalidatePath("/admincp");
  revalidatePath("/admincp/posts");
  revalidatePath("/", "layout");
  redirect("/admincp/posts");
}

export type QuickUpdateResult =
  | {
      success: true;
      id: string;
      title: string;
      slug: string;
      status: string;
      date: string;
    }
  | {
      success: false;
      error: string;
    };

export async function quickUpdatePost(data: QuickUpdatePostInput): Promise<QuickUpdateResult> {
  try {
    await verifyAdminOrEditor();
    const validated = quickUpdateSchema.parse(data);

    const tagsArray =
      typeof validated.tags === "string"
        ? validated.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : validated.tags;

    await updatePostService(validated.id, {
      title: validated.title,
      slug: validated.slug,
      status: validated.status,
      commentStatus: validated.commentStatus,
      pingStatus: validated.pingStatus,
      postPassword: validated.postPassword,
      categorySlugs: validated.categorySlugs,
      tags: tagsArray,
    });

    revalidatePath("/admincp");
    revalidatePath("/admincp/posts");
    revalidatePath("/", "layout");

    return {
      success: true,
      id: validated.id,
      title: validated.title,
      slug: validated.slug || "",
      status: validated.status || "draft",
      date: validated.date || new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Failed to quick update post:", error);
    return { success: false, error: error?.message || "Failed to update post." };
  }
}

export async function trashPostsAction(ids: string[]) {
  try {
    await verifyAdminOrEditor();
    if (!ids.length) return { success: false, error: "No post IDs provided." };

    await trashPostsService(ids);

    revalidatePath("/admincp");
    revalidatePath("/admincp/posts");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to trash posts:", error);
    return { success: false, error: error?.message || "Failed to trash posts." };
  }
}

export async function restorePostsAction(ids: string[]) {
  try {
    await verifyAdminOrEditor();
    if (!ids.length) return { success: false, error: "No post IDs provided." };

    await restorePostsService(ids);

    revalidatePath("/admincp");
    revalidatePath("/admincp/posts");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to restore posts:", error);
    return { success: false, error: error?.message || "Failed to restore posts." };
  }
}

export async function deletePostsPermanentlyAction(ids: string[]) {
  try {
    await verifyAdminOrEditor();
    if (!ids.length) return { success: false, error: "No post IDs provided." };

    await deletePostsService(ids);

    revalidatePath("/admincp");
    revalidatePath("/admincp/posts");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete posts:", error);
    return { success: false, error: error?.message || "Failed to delete posts." };
  }
}

// Aliases for full backward compatibility
export const savePost = savePostAction;
export const updatePost = updatePostAction;
export const movePostsToTrash = trashPostsAction;
export const restorePosts = restorePostsAction;
export const deletePosts = deletePostsPermanentlyAction;
