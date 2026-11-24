"use server"

import { revalidatePath } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { ZodError } from "zod"
import { verifyAdmin } from "@/lib/authMIddleware"
import { RateLimitError } from "@/lib/rate-limit"
import {
  podcastShowSchema,
  podcastShowIdSchema,
} from "@/db/schema/cms-podcasts"
import {
  savePodcastShow,
  deletePodcastShow,
  PodcastShowError,
} from "@/services/podcast-show.service"

function errorKey(error: unknown): string {
  unstable_rethrow(error)
  if (error instanceof RateLimitError) return error.message
  if (error instanceof PodcastShowError) return error.message
  return error instanceof ZodError
    ? "admin.podcasts.error.invalid"
    : "admin.podcasts.error.failed"
}
export async function saveShowAction(
  formData: FormData
): Promise<{ id?: string; error?: string }> {
  await verifyAdmin()
  try {
    const data = podcastShowSchema.parse(Object.fromEntries(formData))
    const id = await savePodcastShow(data)
    revalidatePath("/admincp/podcasts/shows")
    return { id }
  } catch (error) {
    return { error: errorKey(error) }
  }
}
export async function deleteShowAction(
  input: string
): Promise<{ success?: boolean; error?: string }> {
  await verifyAdmin()
  try {
    await deletePodcastShow(podcastShowIdSchema.parse(input))
    revalidatePath("/admincp/podcasts/shows")
    return { success: true }
  } catch (error) {
    return { error: errorKey(error) }
  }
}
