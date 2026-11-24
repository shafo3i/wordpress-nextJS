import "server-only"
import { and, eq, ilike, inArray, ne, sql } from "drizzle-orm"
import { verifyAdmin } from "@/lib/authMIddleware"
import type { DB } from "@/db"
import { wpPosts, wpPostmeta } from "@/db/schema/cms-posts"
import { resolveAttachmentImage } from "@/lib/media-images"
import { safeMediaUrl } from "@/lib/post-media"
import { studioPlayerSource } from "@/lib/studio/media-player"
import { podcastShowIdSchema } from "@/db/schema/cms-podcasts"

export class PodcastEpisodeError extends Error {}
export async function resolveEpisodeAttachment(
  id: string,
  kind: "audio" | "video" | "image",
  database: DB
) {
  await verifyAdmin()
  podcastShowIdSchema.parse(id)
  const [row] = await database
    .select({ guid: wpPosts.guid })
    .from(wpPosts)
    .where(
      and(
        eq(wpPosts.id, BigInt(id)),
        eq(wpPosts.postType, "attachment"),
        ne(wpPosts.postStatus, "trash"),
        ilike(wpPosts.postMimeType, `${kind}/%`)
      )
    )
    .limit(1)
  if (!row) throw new PodcastEpisodeError("admin.podcasts.episode_error.media")
  const metas = await database
    .select({
      key: wpPostmeta.metaKey,
      value: sql<string>`left(${wpPostmeta.metaValue}, 100001)`,
    })
    .from(wpPostmeta)
    .where(
      and(
        eq(wpPostmeta.postId, BigInt(id)),
        inArray(wpPostmeta.metaKey, [
          "_wp_attached_file",
          "_wp_attachment_metadata",
        ])
      )
    )
  const metadata = Object.fromEntries(
    metas
      .filter((meta) => meta.key && meta.value && meta.value.length <= 100000)
      .map((meta) => [meta.key!, meta.value!])
  )
  const url = resolveAttachmentImage(
    row.guid,
    metadata._wp_attached_file,
    metadata._wp_attachment_metadata
  ).url
  const safe =
    kind === "image"
      ? safeMediaUrl(url)
      : studioPlayerSource(
          kind === "audio" ? "multimedia" : "video_player",
          url
        )
  if (!safe) throw new PodcastEpisodeError("admin.podcasts.episode_error.media")
  return safe
}
