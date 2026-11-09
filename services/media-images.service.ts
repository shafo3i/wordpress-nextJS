import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { wpPosts, wpPostmeta } from "@/db/schema"
import { resolveAttachmentImage, type ImageAsset } from "@/lib/media-images"

export async function getPostImageAssets(
  postIds: Array<string | bigint>
): Promise<Map<string, ImageAsset>> {
  const result = new Map<string, ImageAsset>()
  // Bound PostgreSQL parameter counts and memory for sitemap batches too.
  for (let start = 0; start < postIds.length; start += 500) {
    const chunk = postIds.slice(start, start + 500).map((id) => BigInt(id))
    const links = await db
      .select({ postId: wpPostmeta.postId, value: wpPostmeta.metaValue })
      .from(wpPostmeta)
      .where(
        and(
          inArray(wpPostmeta.postId, chunk),
          eq(wpPostmeta.metaKey, "_thumbnail_id")
        )
      )
      .orderBy(desc(wpPostmeta.metaId))
    const ids = [
      ...new Set(
        links
          .map((link) => link.value)
          .filter((value): value is string => !!value && /^\d+$/.test(value))
      ),
    ]
    if (!ids.length) continue
    const [attachments, metas] = await Promise.all([
      db
        .select({ id: wpPosts.id, guid: wpPosts.guid })
        .from(wpPosts)
        .where(
          and(
            inArray(wpPosts.id, ids.map(BigInt)),
            eq(wpPosts.postType, "attachment")
          )
        ),
      db
        .select({
          id: wpPostmeta.postId,
          key: wpPostmeta.metaKey,
          value: wpPostmeta.metaValue,
        })
        .from(wpPostmeta)
        .where(
          and(
            inArray(wpPostmeta.postId, ids.map(BigInt)),
            inArray(wpPostmeta.metaKey, [
              "_wp_attached_file",
              "_wp_attachment_metadata",
            ])
          )
        )
        .orderBy(desc(wpPostmeta.metaId)),
    ])
    const assets = new Map(
      attachments.map((attachment) => {
        const values = metas.filter((meta) => meta.id === attachment.id)
        return [
          attachment.id.toString(),
          resolveAttachmentImage(
            attachment.guid,
            values.find((meta) => meta.key === "_wp_attached_file")?.value ||
              undefined,
            values.find((meta) => meta.key === "_wp_attachment_metadata")
              ?.value || undefined
          ),
        ]
      })
    )
    for (const link of links)
      if (
        link.value &&
        assets.has(link.value) &&
        !result.has(link.postId.toString())
      )
        result.set(link.postId.toString(), assets.get(link.value)!)
  }
  return result
}
