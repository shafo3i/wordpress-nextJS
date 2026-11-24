import "server-only"
import { randomUUID } from "node:crypto"
import { and, eq, ne, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import { verifyAdmin } from "@/lib/authMIddleware"
import { checkCmsRateLimit } from "@/lib/rate-limit"
import { wpPosts, wpPostmeta } from "@/db/schema/cms-posts"
import { wpTermTaxonomy, wpTermRelationships } from "@/db/schema/cms-taxonomy"
import {
  languagesTable,
  termTranslationsTable,
  postTranslationsTable,
} from "@/db/schema/cms-languages"
import { podcastShowIdSchema } from "@/db/schema/cms-podcasts"
import {
  podcastEpisodeSchema,
  podcastEpisodeMetadataSchema,
  PODCAST_EPISODE_TYPE,
  PODCAST_EPISODE_META,
} from "@/db/schema/cms-podcast-episodes"
import { studioPlayerSource } from "@/lib/studio/media-player"
import {
  PodcastEpisodeError,
  resolveEpisodeAttachment,
} from "./podcast-episode-media.service"
export { PodcastEpisodeError } from "./podcast-episode-media.service"

async function lockEpisode(id: string, tx: DB) {
  const [episode] = await tx
    .select({
      id: wpPosts.id,
      status: wpPosts.postStatus,
      date: wpPosts.postDateGmt,
    })
    .from(wpPosts)
    .where(
      and(
        eq(wpPosts.id, BigInt(id)),
        eq(wpPosts.postType, PODCAST_EPISODE_TYPE)
      )
    )
    .limit(1)
    .for("update")
  if (!episode)
    throw new PodcastEpisodeError("admin.podcasts.episode_error.missing")
  return episode
}
export async function savePodcastEpisode(input: unknown, database: DB = db) {
  const session = await verifyAdmin()
  const data = podcastEpisodeSchema.parse(input)
  await checkCmsRateLimit(session.user.id, "write")
  return database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:podcasts'))`
    )
    const existing = data.id ? await lockEpisode(data.id, tx) : undefined
    const [show] = await tx
      .select({ id: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .innerJoin(
        termTranslationsTable,
        eq(termTranslationsTable.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
      )
      .innerJoin(
        languagesTable,
        eq(languagesTable.code, termTranslationsTable.languageCode)
      )
      .where(
        and(
          eq(wpTermTaxonomy.termTaxonomyId, BigInt(data.showId)),
          eq(wpTermTaxonomy.taxonomy, "podcast_show"),
          eq(termTranslationsTable.languageCode, data.languageCode),
          eq(languagesTable.isActive, true)
        )
      )
      .limit(1)
    if (!show)
      throw new PodcastEpisodeError("admin.podcasts.episode_error.show")
    const audioUrl = data.audioId
      ? await resolveEpisodeAttachment(data.audioId, "audio", tx)
      : studioPlayerSource("multimedia", data.audioUrl) || ""
    const videoUrl = data.videoId
      ? await resolveEpisodeAttachment(data.videoId, "video", tx)
      : studioPlayerSource("video_player", data.videoUrl) || ""
    if (data.artworkId)
      await resolveEpisodeAttachment(data.artworkId, "image", tx)
    if (data.status === "publish" && !audioUrl && !videoUrl)
      throw new PodcastEpisodeError("admin.podcasts.episode_error.media")
    const slug = (
      data.postName ||
      data.postTitle
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_-]+/gu, "-")
        .replace(/^-+|-+$/g, "")
    ).slice(0, 200)
    if (!slug)
      throw new PodcastEpisodeError("admin.podcasts.episode_error.invalid")
    const [duplicate] = await tx
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(
        and(
          eq(wpPosts.postType, PODCAST_EPISODE_TYPE),
          eq(wpPosts.postName, slug),
          sql`exists (select 1 from wp_term_relationships r where r.object_id = ${wpPosts.id} and r.term_taxonomy_id = ${show.id})`,
          existing ? ne(wpPosts.id, existing.id) : undefined
        )
      )
      .limit(1)
    if (duplicate)
      throw new PodcastEpisodeError("admin.podcasts.episode_error.slug")
    const now = new Date()
    const publishedAt =
      data.status === "publish" && existing?.status === "publish"
        ? existing.date
        : now
    const values = {
      postTitle: data.postTitle,
      postName: slug,
      postContent: data.postContent,
      postExcerpt: data.postExcerpt,
      postStatus: data.status,
      postModified: now,
      postModifiedGmt: now,
      postDate: publishedAt,
      postDateGmt: publishedAt,
    }
    let id: bigint
    if (existing) {
      id = existing.id
      await tx
        .update(wpPosts)
        .set(values)
        .where(
          and(eq(wpPosts.id, id), eq(wpPosts.postType, PODCAST_EPISODE_TYPE))
        )
      await tx
        .delete(wpPostmeta)
        .where(
          and(
            eq(wpPostmeta.postId, id),
            eq(wpPostmeta.metaKey, PODCAST_EPISODE_META)
          )
        )
    } else {
      const [created] = await tx
        .insert(wpPosts)
        .values({
          ...values,
          postType: PODCAST_EPISODE_TYPE,
          postAuthor: session.user.id,
          commentStatus: "closed",
          pingStatus: "closed",
        })
        .returning({ id: wpPosts.id })
      id = created.id
    }
    const showTaxonomies = sql`select term_taxonomy_id from wp_term_taxonomy where taxonomy = ${"podcast_show"}`
    await tx
      .delete(wpTermRelationships)
      .where(
        and(
          eq(wpTermRelationships.objectId, id),
          sql`${wpTermRelationships.termTaxonomyId} in (${showTaxonomies})`
        )
      )
    await tx
      .insert(wpTermRelationships)
      .values({ objectId: id, termTaxonomyId: show.id })
    await tx
      .insert(postTranslationsTable)
      .values({
        postId: id,
        languageCode: data.languageCode,
        translationGroupId: randomUUID(),
      })
      .onConflictDoUpdate({
        target: postTranslationsTable.postId,
        set: { languageCode: data.languageCode, updatedAt: now },
      })
    await tx
      .insert(wpPostmeta)
      .values({
        postId: id,
        metaKey: PODCAST_EPISODE_META,
        metaValue: JSON.stringify(
          podcastEpisodeMetadataSchema.parse({ ...data, audioUrl, videoUrl })
        ),
      })
    return String(id)
  })
}
export async function deletePodcastEpisode(input: unknown, database: DB = db) {
  const session = await verifyAdmin()
  const id = podcastShowIdSchema.parse(input)
  await checkCmsRateLimit(session.user.id, "write")
  await database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:podcasts'))`
    )
    const episode = await lockEpisode(id, tx)
    await tx
      .delete(wpTermRelationships)
      .where(eq(wpTermRelationships.objectId, episode.id))
    await tx
      .delete(wpPosts)
      .where(
        and(
          eq(wpPosts.id, episode.id),
          eq(wpPosts.postType, PODCAST_EPISODE_TYPE)
        )
      )
  })
}
