import { z } from "zod"
import { createInsertSchema } from "drizzle-orm/zod"
import { wpPosts } from "./cms-posts"
import { podcastShowIdSchema } from "./cms-podcasts"
import { languageCodeSchema } from "./cms-languages"
import { studioPlayerSource } from "@/lib/studio/media-player"

export const PODCAST_EPISODE_TYPE = "podcast_episode"
export const PODCAST_EPISODE_META = "_pressforge_podcast_episode"
const optionalId = z.union([z.literal(""), podcastShowIdSchema]).default("")
const plainText = (maximum: number) =>
  z
    .string()
    .max(maximum)
    .refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))
const numberField = (maximum: number, minimum = 0) =>
  z
    .preprocess(
      (value) =>
        value === "" || value === undefined || value === null ? null : value,
      z.coerce.number().int().min(minimum).max(maximum).nullable()
    )
    .default(null)
const mediaUrl = (kind: "multimedia" | "video_player") =>
  z
    .string()
    .trim()
    .max(2000)
    .refine((value) => !value || Boolean(studioPlayerSource(kind, value)))
    .default("")
export const podcastEpisodeMetadataSchema = z.object({
  audioId: optionalId,
  audioUrl: mediaUrl("multimedia"),
  videoId: optionalId,
  videoUrl: mediaUrl("video_player"),
  artworkId: optionalId,
  duration: numberField(604800),
  season: numberField(100000, 1),
  episodeNumber: numberField(100000, 1),
  transcript: plainText(100000).default(""),
  credits: plainText(10000).default(""),
})
export const podcastEpisodeSchema = createInsertSchema(wpPosts)
  .pick({
    postTitle: true,
    postName: true,
    postContent: true,
    postExcerpt: true,
  })
  .extend({
    id: optionalId,
    postTitle: plainText(300)
      .transform((value) => value.trim())
      .refine((value) => value.length > 0),
    postName: z
      .string()
      .trim()
      .max(200)
      .regex(/^[\p{L}\p{N}_-]*$/u)
      .default(""),
    postContent: plainText(100000).default(""),
    postExcerpt: plainText(2000).default(""),
    showId: podcastShowIdSchema,
    languageCode: languageCodeSchema,
    status: z.enum(["draft", "publish"]).default("draft"),
    ...podcastEpisodeMetadataSchema.shape,
  })
  .refine(
    (data) =>
      data.status !== "publish" ||
      Boolean(data.audioId || data.audioUrl || data.videoId || data.videoUrl),
    {
      path: ["audioUrl"],
      message: "Episode media is required for publication.",
    }
  )
export const podcastEpisodeQuerySchema = z.object({
  search: z.string().trim().max(200).default(""),
  language: z.union([z.literal("all"), languageCodeSchema]).default("all"),
  status: z.enum(["all", "draft", "publish"]).default("all"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
})
export type InsertPodcastEpisode = z.input<typeof podcastEpisodeSchema>
export type InsertPodcastEpisodeOutput = z.output<typeof podcastEpisodeSchema>
export type SelectPodcastEpisode = InsertPodcastEpisodeOutput & {
  id: string
  showName: string
  artworkUrl: string
}
