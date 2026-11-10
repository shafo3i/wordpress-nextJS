"use server"
import { revalidatePath } from "next/cache"
import { verifyAdminOrEditor } from "@/lib/authMIddleware"
import {
  factPostIdSchema,
  factReviewSchema,
  type FactReviewInput,
} from "@/db/schema/cms-fact-reviews"
import {
  findFactReviewPosts,
  getFactReview,
  saveFactReview,
} from "@/services/fact-review.service"

export async function searchFactPosts(search: string) {
  await verifyAdminOrEditor()
  if (typeof search !== "string" || search.length > 100)
    throw new Error("admin.plugins.invalid_config")
  return findFactReviewPosts(search)
}
export async function loadFactReview(postId: string) {
  await verifyAdminOrEditor()
  return getFactReview(factPostIdSchema.parse(postId))
}
export async function saveFactReviewAction(input: FactReviewInput) {
  const session = await verifyAdminOrEditor()
  try {
    await saveFactReview(factReviewSchema.parse(input), {
      id: session.user.id,
      name: session.user.name,
    })
    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    const code =
      error instanceof Error && error.message.startsWith("admin.plugins.fact.")
        ? error.message
        : "admin.plugins.invalid_config"
    return { success: false, error: code }
  }
}
