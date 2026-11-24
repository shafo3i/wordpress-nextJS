import "server-only"
import { unstable_rethrow } from "next/navigation"
import { and, count, desc, eq, ilike, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import { verifyAdmin } from "@/lib/authMIddleware"
import { wpPosts, wpPostmeta } from "@/db/schema/cms-posts"
import {
  wpTerms,
  wpTermTaxonomy,
  wpTermRelationships,
} from "@/db/schema/cms-taxonomy"
import { postTranslationsTable } from "@/db/schema/cms-languages"
import { podcastShowIdSchema } from "@/db/schema/cms-podcasts"
import {
  PODCAST_EPISODE_TYPE,
  PODCAST_EPISODE_META,
  podcastEpisodeMetadataSchema,
  podcastEpisodeQuerySchema,
  type SelectPodcastEpisode,
} from "@/db/schema/cms-podcast-episodes"
import { resolveEpisodeAttachment } from "./podcast-episode-media.service"

export async function listPodcastEpisodes(
  options: unknown = {},
  database: DB = db
) {
  await verifyAdmin()
  const query = podcastEpisodeQuerySchema.parse(options)
  const conditions = [eq(wpPosts.postType, PODCAST_EPISODE_TYPE)]
  if (query.status !== "all")
    conditions.push(eq(wpPosts.postStatus, query.status))
  if (query.language !== "all")
    conditions.push(eq(postTranslationsTable.languageCode, query.language))
  if (query.search)
    conditions.push(ilike(wpPosts.postTitle, `%${query.search}%`))
  const [total] = await database
    .select({ total: count() })
    .from(wpPosts)
    .leftJoin(
      postTranslationsTable,
      eq(postTranslationsTable.postId, wpPosts.id)
    )
    .where(and(...conditions))
  const page = Math.min(
    query.page,
    Math.max(1, Math.ceil((total?.total || 0) / 20))
  )
  const items = await database
    .select({
      id: sql<string>`${wpPosts.id}::text`,
      postTitle: wpPosts.postTitle,
      status: wpPosts.postStatus,
      languageCode: postTranslationsTable.languageCode,
      date: wpPosts.postDateGmt,
    })
    .from(wpPosts)
    .leftJoin(
      postTranslationsTable,
      eq(postTranslationsTable.postId, wpPosts.id)
    )
    .where(and(...conditions))
    .orderBy(desc(wpPosts.postDateGmt), desc(wpPosts.id))
    .limit(20)
    .offset((page - 1) * 20)
  return {
    items: items.map((item) => ({ ...item, date: item.date.toISOString() })),
    total: total?.total || 0,
    page,
  }
}
export async function getPodcastEpisode(
  input: unknown,
  database: DB = db
): Promise<SelectPodcastEpisode | null> {
  await verifyAdmin()
  const id = podcastShowIdSchema.parse(input)
  const [row] = await database
    .select({
      id: wpPosts.id,
      postTitle: wpPosts.postTitle,
      postName: wpPosts.postName,
      postContent: wpPosts.postContent,
      postExcerpt: wpPosts.postExcerpt,
      status: wpPosts.postStatus,
      languageCode: postTranslationsTable.languageCode,
    })
    .from(wpPosts)
    .leftJoin(
      postTranslationsTable,
      eq(postTranslationsTable.postId, wpPosts.id)
    )
    .where(
      and(
        eq(wpPosts.id, BigInt(id)),
        eq(wpPosts.postType, PODCAST_EPISODE_TYPE)
      )
    )
    .limit(1)
  if (!row) return null
  const [configuration] = await database
    .select({ value: sql<string>`left(${wpPostmeta.metaValue}, 256001)` })
    .from(wpPostmeta)
    .where(
      and(
        eq(wpPostmeta.postId, row.id),
        eq(wpPostmeta.metaKey, PODCAST_EPISODE_META)
      )
    )
    .limit(1)
  let metadata = podcastEpisodeMetadataSchema.parse({})
  try {
    metadata = podcastEpisodeMetadataSchema.parse(
      JSON.parse(configuration?.value || "{}")
    )
  } catch {
    /* Invalid legacy metadata is editable, never executed. */
  }
  const [show] = await database
    .select({ id: wpTermTaxonomy.termTaxonomyId, name: wpTerms.name })
    .from(wpTermRelationships)
    .innerJoin(
      wpTermTaxonomy,
      eq(wpTermTaxonomy.termTaxonomyId, wpTermRelationships.termTaxonomyId)
    )
    .innerJoin(wpTerms, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(
      and(
        eq(wpTermRelationships.objectId, row.id),
        eq(wpTermTaxonomy.taxonomy, "podcast_show")
      )
    )
    .limit(1)
  let artworkUrl = ""
  if (metadata.artworkId)
    try {
      artworkUrl = await resolveEpisodeAttachment(
        metadata.artworkId,
        "image",
        database
      )
    } catch (error) {
      unstable_rethrow(
        error
      ) /* A removed image must not block repairing the episode. */
    }
  return {
    ...row,
    id: String(row.id),
    status: row.status === "publish" ? "publish" : "draft",
    languageCode: row.languageCode || "",
    showId: show ? String(show.id) : "",
    showName: show?.name || "",
    ...metadata,
    artworkUrl,
  }
}
