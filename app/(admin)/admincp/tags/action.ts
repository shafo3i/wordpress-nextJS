"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { verifyPostEditor } from "@/lib/authMIddleware";
import {
  createTag as createTagService,
  updateTag as updateTagService,
  quickUpdateTag as quickUpdateTagService,
  bulkDeleteTags as bulkDeleteTagsService,
} from "@/services/tag.service";
import {
  createTagSchema,
  updateTagSchema,
  quickUpdateTagSchema,
  deleteTagsSchema,
} from "@/db/schema/cms-taxonomy";
import { getAdminLanguageContext } from "@/components/admin/admin-shell";
import { ZodError } from "zod";

async function tagErrorMessage(error: unknown): Promise<string> {
  unstable_rethrow(error);
  const { dict } = await getAdminLanguageContext();
  const key =
    error instanceof Error && ["admin.tags.error.language", "admin.tags.error.translation", "admin.tags.error.shared", "admin.tags.error.missing"].includes(error.message)
      ? error.message
      : error instanceof ZodError
        ? "admin.tags.error.invalid"
        : "admin.tags.error.failed";
  return dict[key] || dict["admin.tags.error.failed"] || "";
}
async function tagMutation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new Error(await tagErrorMessage(error));
  }
}

export async function createTag(formData: FormData) {
  await verifyPostEditor();

  const tag = await tagMutation(async () =>
    createTagService(
      createTagSchema.parse(Object.fromEntries(formData.entries()))
    )
  );

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  return { success: true, id: tag.id };
}

export async function updateTag(formData: FormData) {
  await verifyPostEditor();

  await tagMutation(async () => {
    const parsed = updateTagSchema.parse(
      Object.fromEntries(formData.entries())
    );
    return updateTagService(parsed.termId, parsed);
  });

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  redirect("/admincp/tags");
}

export async function quickUpdateTag(data: {
  id: string;
  name: string;
  slug?: string;
}) {
  await verifyPostEditor();

  const result = await tagMutation(async () => {
    const parsed = quickUpdateTagSchema.parse(data);
    return quickUpdateTagService(parsed.id, parsed);
  });

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");
  return { success: true, ...result };
}

export async function deleteTags(
  ids: string[]
): Promise<{ success?: boolean; count?: number; error?: string }> {
  await verifyPostEditor();

  let res;
  try {
    res = await bulkDeleteTagsService(deleteTagsSchema.parse(ids));
  } catch (error) {
    return { error: await tagErrorMessage(error) };
  }

  revalidatePath("/admincp/tags");
  revalidatePath("/admincp/posts");

  return { success: true, count: res.count };
}

// Aliases for compatibility
export const createTagAction = createTag;
export const updateTagAction = updateTag;
export const quickUpdateTagAction = quickUpdateTag;
export const deleteTagsAction = deleteTags;
