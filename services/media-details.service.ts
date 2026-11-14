import "server-only";
import { verifyPostEditor } from "@/lib/authMIddleware";
import path from "node:path"
import fs from "node:fs/promises"
import { and, eq, inArray, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpPosts, wpPostmeta, user } from "@/db/schema"
import {
  mediaItemIdSchema,
  mediaDetailsPatchSchema,
  type MediaDetailsPatch,
} from "@/db/schema/cms-media-details"
import { mapMediaAttachment } from "@/lib/media-attachment"

export async function getMediaItemDetails(id: number, database: DB = db) {
  await verifyPostEditor();
  mediaItemIdSchema.parse(id)
  const [row] = await database
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      caption: wpPosts.postExcerpt,
      description: wpPosts.postContent,
      mimeType: wpPosts.postMimeType,
      guid: wpPosts.guid,
      postDate: wpPosts.postDate,
      postParent: wpPosts.postParent,
      authorName: user.name,
    })
    .from(wpPosts)
    .leftJoin(user, eq(user.id, wpPosts.postAuthor))
    .where(and(eq(wpPosts.id, BigInt(id)), eq(wpPosts.postType, "attachment")))
    .limit(1)
  if (!row) return null
  const metas = await database
    .select({ key: wpPostmeta.metaKey, value: sql<string>`left(${wpPostmeta.metaValue}, 100001)` })
    .from(wpPostmeta)
    .where(and(eq(wpPostmeta.postId, BigInt(id)), inArray(wpPostmeta.metaKey, ["_wp_attached_file", "_wp_attachment_metadata", "_wp_attachment_image_alt"])))
  const item = mapMediaAttachment(
    row,
    Object.fromEntries(
      metas.filter((m) => m.key && m.value && m.value.length <= 100000).map((m) => [m.key!, m.value!])
    ),
    true
  )
  if (!item.sizeBytes && item.url.startsWith("/uploads/"))
    try {
      const parts = item.url.slice(9).split("/").map(decodeURIComponent)
      if (
        parts.some(
          (p) => !p || p === "." || p === ".." || /[\\/\u0000]/.test(p)
        )
      )
        return item
      const root = await fs.realpath(
          path.join(process.cwd(), "public/uploads")
        ),
        file = await fs.realpath(path.join(root, ...parts)),
        relative = path.relative(root, file)
      if (relative.startsWith("..") || path.isAbsolute(relative)) return item
      const stat = await fs.stat(file)
      if (stat.isFile()) item.sizeBytes = stat.size
    } catch {
      /* Missing files stay unknown; never report an invented size or fetch remote URLs. */
    }
  return item
}
export async function updateMediaDetails(
  id: number,
  patch: MediaDetailsPatch,
  database: DB = db
) {
  await verifyPostEditor();
  mediaItemIdSchema.parse(id)
  const data = mediaDetailsPatchSchema.parse(patch)
  await database.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(
        and(eq(wpPosts.id, BigInt(id)), eq(wpPosts.postType, "attachment"))
      )
      .for("update")
      .limit(1)
    if (!row) throw new Error("admin.media.details_not_found")
    await tx
      .update(wpPosts)
      .set({
        ...(data.title !== undefined ? { postTitle: data.title } : {}),
        ...(data.caption !== undefined ? { postExcerpt: data.caption } : {}),
        ...(data.description !== undefined
          ? { postContent: data.description }
          : {}),
        postModified: new Date(),
        postModifiedGmt: new Date(),
      })
      .where(eq(wpPosts.id, row.id))
    if (data.altText !== undefined) {
      const condition = and(
          eq(wpPostmeta.postId, row.id),
          eq(wpPostmeta.metaKey, "_wp_attachment_image_alt")
        ),
        [existing] = await tx
          .select({ id: wpPostmeta.metaId })
          .from(wpPostmeta)
          .where(condition)
          .limit(1)
      if (existing)
        await tx
          .update(wpPostmeta)
          .set({ metaValue: data.altText })
          .where(condition)
      else
        await tx
          .insert(wpPostmeta)
          .values({
            postId: row.id,
            metaKey: "_wp_attachment_image_alt",
            metaValue: data.altText,
          })
    }
  })
}
