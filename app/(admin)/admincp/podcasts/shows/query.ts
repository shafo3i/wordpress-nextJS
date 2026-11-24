import "server-only"
import { verifyAdmin } from "@/lib/authMIddleware"
import { listPodcastShows } from "@/services/podcast-show.service"

export async function getPodcastShows(options: unknown) {
  await verifyAdmin()
  return listPodcastShows(options)
}
