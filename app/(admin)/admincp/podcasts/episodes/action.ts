"use server"
import { revalidatePath } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { ZodError } from "zod"
import { verifyAdmin } from "@/lib/authMIddleware"
import { RateLimitError } from "@/lib/rate-limit"
import { podcastEpisodeSchema } from "@/db/schema/cms-podcast-episodes"
import {
  podcastShowIdSchema,
  podcastShowQuerySchema,
} from "@/db/schema/cms-podcasts"
import {
  savePodcastEpisode,
  deletePodcastEpisode,
  PodcastEpisodeError,
} from "@/services/podcast-episode.service"
import { listPodcastShows } from "@/services/podcast-show.service"

function errorKey(error: unknown) {
  unstable_rethrow(error)
  if (error instanceof RateLimitError || error instanceof PodcastEpisodeError)
    return error.message
  return error instanceof ZodError
    ? "admin.podcasts.episode_error.invalid"
    : "admin.podcasts.episode_error.failed"
}
export async function saveEpisodeAction(
  formData: FormData
): Promise<{ id?: string; error?: string }> {
  await verifyAdmin()
  try {
    const data = podcastEpisodeSchema.parse(Object.fromEntries(formData))
    const id = await savePodcastEpisode(data)
    revalidatePath("/admincp/podcasts/episodes")
    return { id }
  } catch (error) {
    return { error: errorKey(error) }
  }
}
export async function deleteEpisodeAction(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  await verifyAdmin()
  try {
    await deletePodcastEpisode(podcastShowIdSchema.parse(id))
    revalidatePath("/admincp/podcasts/episodes")
    return { success: true }
  } catch (error) {
    return { error: errorKey(error) }
  }
}
export async function searchEpisodeShowsAction(input: unknown) {
  await verifyAdmin()
  const query = podcastShowQuerySchema.parse(input)
  const result = await listPodcastShows({
    language: query.language,
    search: query.search,
    page: query.page,
  })
  return {
    items: result.items.map((show) => ({
      id: show.taxonomyId,
      name: show.name,
    })),
    total: result.total,
    page: result.page,
  }
}
