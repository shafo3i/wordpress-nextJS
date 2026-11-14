"use server"

import { autosaveDocumentKey } from "@/db/schema/cms-post-autosave"
import { deletePostAutosave } from "@/services/post-autosave.service"
import { revalidatePath } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"
import {
  createPostEditorSchema,
  updatePostEditorSchema,
  quickPostEditorSchema,
  postIdSchema,
} from "@/db/schema/cms-post-editor"
import { verifyPostEditor, verifyAdmin } from "@/lib/authMIddleware"
import {
  PostChangedError,
  PostPermissionError,
  createPost as createPostService,
  updatePost as updatePostService,
  getPostById,
  trashPosts as trashPostsService,
  restorePosts as restorePostsService,
  deletePosts as deletePostsService,
} from "@/services/post.service"

export type QuickUpdatePostInput = {
  id: string
  title: string
  slug?: string
  date?: string
  status?: string
  commentStatus?: "open" | "closed"
  pingStatus?: "open" | "closed"
  postPassword?: string
  categorySlugs?: string[]
  tags?: string | string[]
}
function parsePostFormData(form: FormData, update = false) {
  const raw = Object.fromEntries(form)
  const split = (value: unknown) =>
    typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : value
  const input = {
    ...raw,
    ...(form.has("menuOrder")
      ? {
          menuOrder:
            typeof raw.menuOrder === "string" && /^-?\d+$/.test(raw.menuOrder)
              ? Number(raw.menuOrder)
              : raw.menuOrder,
        }
      : {}),
    ...(form.has("categorySlugs")
      ? { categorySlugs: split(raw.categorySlugs) }
      : {}),
    ...(form.has("tags") ? { tags: split(raw.tags) } : {}),
    ...(form.has("isFeatured") ? { isFeatured: raw.isFeatured === "1" } : {}),
    ...(form.has("languageCode") && raw.languageCode === ""
      ? { languageCode: undefined }
      : {}),
    ...(form.has("translationOf")
      ? { translationOf: raw.translationOf || undefined }
      : {}),
    ...(form.has("expectedModifiedAt")
      ? { expectedModified: raw.expectedModifiedAt || undefined }
      : {}),
    ...(Object.keys(raw).some((key) => key.startsWith("seo"))
      ? {
          seo: {
            seoTitle: raw.seoTitle,
            seoDescription: raw.seoDescription,
            seoOgImage: raw.seoOgImage,
            seoNoindex: form.has("seoNoindex")
              ? raw.seoNoindex === "1"
              : undefined,
            seoCanonical: raw.seoCanonical,
          },
        }
      : {}),
  }
  return update
    ? updatePostEditorSchema.parse(input)
    : createPostEditorSchema.parse(input)
}

export type SavePostResult =
  { success: true; postId: string } | { success: false; error: string }

async function clearSavedRecovery(
  formData: FormData,
  ownerId: string,
  postId?: string
) {
  const key = autosaveDocumentKey.safeParse(formData.get("autosaveDocument"))
  const version = Number(formData.get("autosaveVersion"))
  if (
    key.success &&
    (postId ? key.data === `post:${postId}` : key.data.startsWith("new:")) &&
    Number.isSafeInteger(version) &&
    version >= 0
  ) {
    try {
      await deletePostAutosave(ownerId, key.data, version)
    } catch {
      console.warn(
        "Post saved; recovery cleanup will be retried on a later edit."
      )
    }
  }
}

export async function savePostAction(
  formData: FormData
): Promise<SavePostResult> {
  const session = await verifyPostEditor()
  let postId: string
  try {
    const parsed = parsePostFormData(formData)
    postId = await createPostService({
      ...parsed,
      title: parsed.title!,
      authorId: session.user.id,
      editorRestricted: session.user.role === "editor",
    })
  } catch (error) {
    unstable_rethrow(error)
    return {
      success: false,
      error:
        error instanceof PostPermissionError
          ? "admin.editor.permission_denied"
          : "admin.editor.save_failed",
    }
  }
  await clearSavedRecovery(formData, session.user.id)
  revalidatePath("/admincp")
  revalidatePath("/admincp/posts")
  revalidatePath("/", "layout")
  return { success: true, postId }
}

export async function updatePostAction(
  formData: FormData
): Promise<SavePostResult> {
  const session = await verifyPostEditor()
  const postId = String(formData.get("id") ?? "")
  if (!postIdSchema.safeParse(postId).success)
    return { success: false, error: "admin.editor.save_failed" }
  try {
    const parsed = parsePostFormData(formData, true)
    await updatePostService(postId, {
      ...parsed,
      editorRestricted: session.user.role === "editor",
      expectedModified:
        String(formData.get("expectedModifiedAt") || "") || undefined,
    })
  } catch (error) {
    unstable_rethrow(error)
    return {
      success: false,
      error:
        error instanceof PostPermissionError
          ? "admin.editor.permission_denied"
          : error instanceof PostChangedError
            ? "admin.editor.post_changed"
            : "admin.editor.save_failed",
    }
  }
  await clearSavedRecovery(formData, session.user.id, postId)
  revalidatePath("/admincp")
  revalidatePath("/admincp/posts")
  revalidatePath("/", "layout")
  return { success: true, postId }
}

export type QuickUpdateResult =
  | {
      success: true
      id: string
      title: string
      slug: string
      status: string
      date: string
    }
  | {
      success: false
      error: string
    }

export async function quickUpdatePost(
  data: QuickUpdatePostInput
): Promise<QuickUpdateResult> {
  const session = await verifyPostEditor()
  try {
    const validated = quickPostEditorSchema.parse(data)

    const tagsArray =
      typeof validated.tags === "string"
        ? validated.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : validated.tags

    await updatePostService(validated.id, {
      title: validated.title,
      editorRestricted: session.user.role === "editor",
      slug: validated.slug,
      status: validated.status,
      commentStatus: validated.commentStatus,
      pingStatus: validated.pingStatus,
      postPassword: validated.postPassword,
      categorySlugs: validated.categorySlugs,
      tags: tagsArray,
      date: validated.date,
    })

    revalidatePath("/admincp")
    revalidatePath("/admincp/posts")
    revalidatePath("/", "layout")

    const result = await getPostById(validated.id)
    if (!result) return { success: false, error: "admin.editor.save_failed" }
    return {
      success: true,
      id: validated.id,
      title: result.post.title,
      slug: result.post.slug,
      status: result.post.status,
      date: result.post.date,
    }
  } catch (error) {
    unstable_rethrow(error)
    return {
      success: false,
      error:
        error instanceof PostPermissionError
          ? "admin.editor.permission_denied"
          : "admin.editor.save_failed",
    }
  }
}

export async function trashPostsAction(ids: string[]) {
  await verifyAdmin()
  try {
    await trashPostsService(ids)

    revalidatePath("/admincp")
    revalidatePath("/admincp/posts")
    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict["admin.editor.save_failed"] || "" }
  }
}

export async function restorePostsAction(ids: string[]) {
  await verifyAdmin()
  try {
    await restorePostsService(ids)

    revalidatePath("/admincp")
    revalidatePath("/admincp/posts")
    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict["admin.editor.save_failed"] || "" }
  }
}

export async function deletePostsPermanentlyAction(ids: string[]) {
  await verifyAdmin()
  try {
    await deletePostsService(ids)

    revalidatePath("/admincp")
    revalidatePath("/admincp/posts")
    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    unstable_rethrow(error)
    const { dict } = await getAdminLanguageContext()
    return { success: false, error: dict["admin.editor.save_failed"] || "" }
  }
}

// Aliases for full backward compatibility
export const savePost = savePostAction
export const updatePost = updatePostAction
export const movePostsToTrash = trashPostsAction
export const restorePosts = restorePostsAction
export const deletePosts = deletePostsPermanentlyAction
