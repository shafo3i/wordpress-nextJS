import "server-only"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  listPodcastEpisodes,
  getPodcastEpisode,
} from "@/services/podcast-episode-query.service"
export async function getEpisodes(options: unknown) {
  await verifyAdmin()
  return listPodcastEpisodes(options)
}
export async function getEpisode(id: string) {
  await verifyAdmin()
  return getPodcastEpisode(id)
}
