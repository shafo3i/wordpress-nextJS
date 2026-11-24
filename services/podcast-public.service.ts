import "server-only"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { db, type DB } from "@/db"
import { languageCodeSchema } from "@/db/schema/cms-languages"
import {
  podcastShowIdSchema,
  podcastShowMetadataSchema,
} from "@/db/schema/cms-podcasts"
import { podcastEpisodeMetadataSchema } from "@/db/schema/cms-podcast-episodes"
import { resolveAttachmentImage } from "@/lib/media-images"
import { studioPlayerSource } from "@/lib/studio/media-player"

const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[\p{L}\p{N}_-]+$/u)
const pageSchema = z.coerce.number().int().min(1).max(100000).catch(1)
const pageSize = 12
type ShowRow = {
  id: string
  name: string
  slug: string
  description: string
  config: string
}
export type PublicPodcastShow = Omit<ShowRow, "config"> & {
  presenters: string
  website: string
  artwork: string
}
type EpisodeRow = {
  id: string
  title: string
  slug: string
  summary: string
  description: string
  date: Date | string
  config: string
  showConfig: string
}
export type PublicPodcastEpisode = Omit<
  EpisodeRow,
  "config" | "date" | "showConfig"
> & {
  date: string
  artwork: string
  audio: string
  video: string
  duration: number | null
  season: number | null
  episodeNumber: number | null
  transcript: string
  credits: string
}
function parseMetadata<T>(schema: z.ZodType<T>, value: string): T | null {
  try {
    return schema.parse(JSON.parse(value))
  } catch {
    return null
  }
}
// Read only the latest owned metadata. Never cast legacy text to JSON in SQL:
// malformed legacy JSON must not crash the public directory. Re-validate below.
const showFrom = sql`FROM wp_term_taxonomy x
  JOIN wp_terms t ON t.term_id = x.term_id
  JOIN cms_term_translations l ON l.term_taxonomy_id = x.term_taxonomy_id
  JOIN cms_languages lang ON lang.code = l.language_code AND lang.is_active = true
  JOIN LATERAL (SELECT left(meta_value,10001) AS value FROM wp_termmeta
    WHERE term_id = t.term_id AND meta_key = '_pressforge_podcast_show'
    ORDER BY meta_id DESC LIMIT 1) c ON true`
const showPublished = sql`x.taxonomy = 'podcast_show' AND c.value ~ '"status"[[:space:]]*:[[:space:]]*"published"'`
const showFields = sql`x.term_taxonomy_id::text AS id, t.name, t.slug, x.description, c.value AS config`

async function assets(ids: string[], database: DB) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return new Map<string, { url: string; mime: string }>()
  const result = await database.execute<{
    id: string
    guid: string
    mime: string
    file: string | null
  }>(sql`
    SELECT p."ID"::text AS id, p.guid, p.post_mime_type AS mime,
      (SELECT left(meta_value,2001) FROM wp_postmeta WHERE post_id=p."ID"
       AND meta_key='_wp_attached_file' ORDER BY meta_id DESC LIMIT 1) AS file
    FROM wp_posts p WHERE p.post_type='attachment' AND p.post_status <> 'trash'
    AND p."ID" IN (${sql.join(
      unique.map((id) => sql`${id}::bigint`),
      sql`, `
    )})`)
  return new Map(
    result.rows.map((row) => [
      row.id,
      {
        url: resolveAttachmentImage(row.guid, row.file || undefined).url,
        mime: row.mime,
      },
    ])
  )
}
async function hydrateShows(rows: ShowRow[], database: DB) {
  const parsed = rows.flatMap((row) => {
    const metadata = parseMetadata(podcastShowMetadataSchema, row.config)
    return metadata?.status === "published" ? [{ row, metadata }] : []
  })
  const images = await assets(
    parsed.map((item) => item.metadata.artworkId),
    database
  )
  return parsed.map(({ row, metadata }): PublicPodcastShow => {
    const image = images.get(metadata.artworkId)
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      presenters: metadata.presenters,
      website: metadata.website,
      artwork: image?.mime.startsWith("image/") ? image.url : "",
    }
  })
}
export async function listPublicPodcastShows(
  language: string,
  inputPage: unknown = 1,
  database: DB = db
) {
  languageCodeSchema.parse(language)
  const where = sql`${showPublished} AND l.language_code = ${language}`
  const count = await database.execute<{ total: number }>(
    sql`SELECT count(*)::int AS total ${showFrom} WHERE ${where}`
  )
  const total = count.rows[0]?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(pageSchema.parse(inputPage), totalPages)
  const rows =
    await database.execute<ShowRow>(sql`SELECT ${showFields} ${showFrom} WHERE ${where}
    ORDER BY t.name, x.term_taxonomy_id LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`)
  return { items: await hydrateShows(rows.rows, database), page, totalPages }
}
export async function getPublicPodcastShow(
  slug: string,
  language: string,
  database: DB = db
) {
  slugSchema.parse(slug)
  languageCodeSchema.parse(language)
  const rows =
    await database.execute<ShowRow>(sql`SELECT ${showFields} ${showFrom}
    WHERE ${showPublished} AND l.language_code = ${language} AND t.slug = ${slug} LIMIT 1`)
  return (await hydrateShows(rows.rows, database))[0] || null
}
function episodeWhere(showId: string, language: string) {
  return sql`p.post_type = 'podcast_episode' AND p.post_status = 'publish'
    AND p.post_date_gmt <= timezone('UTC', now()) AND pl.language_code = ${language}
    AND ${showPublished} AND l.language_code = ${language} AND x.term_taxonomy_id = ${showId}::bigint`
}
const episodeFrom = sql`${showFrom}
  JOIN wp_term_relationships r ON r.term_taxonomy_id = x.term_taxonomy_id
  JOIN wp_posts p ON p."ID" = r.object_id
  JOIN cms_post_translations pl ON pl.post_id = p."ID"`
const episodeFields = sql`p."ID"::text AS id, p.post_title AS title, p.post_name AS slug, c.value AS "showConfig",
  p.post_excerpt AS summary, p.post_content AS description, p.post_date_gmt AT TIME ZONE 'UTC' AS date,
  (SELECT left(meta_value,256001) FROM wp_postmeta WHERE post_id=p."ID"
   AND meta_key='_pressforge_podcast_episode' ORDER BY meta_id DESC LIMIT 1) AS config`
async function hydrateEpisodes(rows: EpisodeRow[], database: DB) {
  const parsed = rows.flatMap((row) => {
    if (
      parseMetadata(podcastShowMetadataSchema, row.showConfig)?.status !==
      "published"
    )
      return []
    const metadata = parseMetadata(podcastEpisodeMetadataSchema, row.config)
    return metadata ? [{ row, metadata }] : []
  })
  const media = await assets(
    parsed.flatMap(({ metadata: m }) => [m.artworkId, m.audioId, m.videoId]),
    database
  )
  return parsed.flatMap(({ row, metadata: m }): PublicPodcastEpisode[] => {
    // Drizzle's raw node-postgres adapter leaves timestamptz values as strings.
    // The query supplies an explicit offset, so conversion preserves UTC across hosts.
    const date =
      row.date instanceof Date
        ? row.date
        : typeof row.date === "string"
          ? new Date(row.date)
          : null
    if (!date || !Number.isFinite(date.getTime())) return []
    const resolve = (kind: "audio" | "video") => {
      const id = kind === "audio" ? m.audioId : m.videoId
      const asset = media.get(id)
      // A deleted/incorrect attachment must not silently revert to a stale URL.
      const url = id
        ? asset?.mime.startsWith(`${kind}/`)
          ? asset.url
          : ""
        : kind === "audio"
          ? m.audioUrl
          : m.videoUrl
      return (
        studioPlayerSource(
          kind === "audio" ? "multimedia" : "video_player",
          url
        ) || ""
      )
    }
    const audio = resolve("audio"),
      video = resolve("video")
    if (!audio && !video) return []
    const image = media.get(m.artworkId)
    return [
      {
        id: row.id,
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        description: row.description,
        date: date.toISOString(),
        audio,
        video,
        artwork: image?.mime.startsWith("image/") ? image.url : "",
        duration: m.duration,
        season: m.season,
        episodeNumber: m.episodeNumber,
        transcript: m.transcript,
        credits: m.credits,
      },
    ]
  })
}
export async function listPublicPodcastEpisodes(
  showId: string,
  language: string,
  inputPage: unknown = 1,
  database: DB = db
) {
  podcastShowIdSchema.parse(showId)
  languageCodeSchema.parse(language)
  const where = episodeWhere(showId, language)
  const count = await database.execute<{ total: number }>(
    sql`SELECT count(DISTINCT p."ID")::int AS total ${episodeFrom} WHERE ${where}`
  )
  const totalPages = Math.max(
    1,
    Math.ceil((count.rows[0]?.total || 0) / pageSize)
  )
  const page = Math.min(pageSchema.parse(inputPage), totalPages)
  const rows =
    await database.execute<EpisodeRow>(sql`SELECT DISTINCT ${episodeFields} ${episodeFrom} WHERE ${where}
    ORDER BY date DESC,id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`)
  return { items: await hydrateEpisodes(rows.rows, database), page, totalPages }
}
export async function getPublicPodcastEpisode(
  showId: string,
  slug: string,
  language: string,
  database: DB = db
) {
  podcastShowIdSchema.parse(showId)
  slugSchema.parse(slug)
  languageCodeSchema.parse(language)
  const rows =
    await database.execute<EpisodeRow>(sql`SELECT ${episodeFields} ${episodeFrom}
    WHERE ${episodeWhere(showId, language)} AND p.post_name=${slug} LIMIT 1`)
  return (await hydrateEpisodes(rows.rows, database))[0] || null
}
