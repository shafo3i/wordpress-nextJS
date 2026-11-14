import "server-only"
import { verifyPostEditor } from "@/lib/authMIddleware"
import {
  postAutosaveRequestSchema,
  autosaveDocumentKey,
} from "@/db/schema/cms-post-autosave"
import { renderPostMedia } from "@/lib/post-content-media"
import { and, desc, eq, like } from "drizzle-orm"
import { db, type DB } from "@/db"
import { user } from "@/db/schema/auth-schema"
import { wpPosts, wpUsermeta } from "@/db/schema/cms-posts"
import {
  AUTOSAVE_TTL_MS,
  postAutosaveRecordSchema,
  type PostAutosaveRecord,
  type PostAutosaveRequest,
} from "@/db/schema/cms-post-autosave"

const PREFIX = "_cms_post_autosave:"
export class PostAutosaveError extends Error {
  constructor(
    public code: "conflict" | "post_changed" | "not_found" | "forbidden",
    public status: number
  ) {
    super(code)
  }
}
export function readPostAutosave(
  value: string | null,
  now = Date.now()
): PostAutosaveRecord | null {
  try {
    const parsed = postAutosaveRecordSchema.safeParse(
      JSON.parse(value || "null")
    )
    return parsed.success &&
      now - new Date(parsed.data.savedAt).getTime() <= AUTOSAVE_TTL_MS &&
      new Date(parsed.data.savedAt).getTime() <= now + 60_000
      ? parsed.data
      : null
  } catch {
    return null
  }
}

export async function getPostAutosave(
  ownerId: string,
  documentKey: string,
  database: DB = db
) {
  const session = await verifyPostEditor()
  if (session.user.id !== ownerId) throw new PostAutosaveError("forbidden", 403)
  documentKey = autosaveDocumentKey.parse(documentKey)
  const [row] = await database
    .select({ value: wpUsermeta.metaValue })
    .from(wpUsermeta)
    .where(
      and(
        eq(wpUsermeta.userId, ownerId),
        eq(wpUsermeta.metaKey, PREFIX + documentKey)
      )
    )
    .orderBy(desc(wpUsermeta.umetaId))
    .limit(1)
  return readPostAutosave(row?.value || null)
}

export async function savePostAutosave(
  ownerId: string,
  input: PostAutosaveRequest,
  database: DB = db
) {
  const session = await verifyPostEditor()
  input = postAutosaveRequestSchema.parse(input)
  if (session.user.id !== ownerId || input.ownerId !== ownerId)
    throw new PostAutosaveError("forbidden", 403)
  return database.transaction(async (tx) => {
    // Serialize this user's writes without requiring another table or unique constraint.
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, ownerId))
      .for("update")
    if (input.documentKey.startsWith("post:")) {
      const [post] = await tx
        .select({
          modified: wpPosts.postModifiedGmt,
          status: wpPosts.postStatus,
        })
        .from(wpPosts)
        .where(
          and(
            eq(wpPosts.id, BigInt(input.documentKey.slice(5))),
            eq(wpPosts.postType, "post")
          )
        )
        .limit(1)
      if (post?.status === "trash" && session.user.role !== "admin")
        throw new PostAutosaveError("forbidden", 403)
      if (!post) throw new PostAutosaveError("not_found", 404)
      if (
        input.baseModified &&
        post.modified.toISOString() !== input.baseModified
      )
        throw new PostAutosaveError("post_changed", 409)
    }
    const rows = await tx
      .select({ id: wpUsermeta.umetaId, value: wpUsermeta.metaValue })
      .from(wpUsermeta)
      .where(
        and(
          eq(wpUsermeta.userId, ownerId),
          eq(wpUsermeta.metaKey, PREFIX + input.documentKey)
        )
      )
      .orderBy(desc(wpUsermeta.umetaId))
    const current = readPostAutosave(rows[0]?.value || null)
    let previousVersion = 0
    try {
      previousVersion = postAutosaveRecordSchema.parse(
        JSON.parse(rows[0]?.value || "null")
      ).version
    } catch {
      /* No valid prior version. */
    }
    if ((current?.version || 0) !== input.expectedVersion)
      throw new PostAutosaveError("conflict", 409)
    const record: PostAutosaveRecord = {
      documentKey: input.documentKey,
      baseModified: input.baseModified,
      snapshot: {
        ...input.snapshot,
        content: renderPostMedia(input.snapshot.content),
      },
      version: Math.max(Date.now(), previousVersion + 1),
      savedAt: new Date().toISOString(),
    }
    if (rows.length)
      await tx
        .update(wpUsermeta)
        .set({ metaValue: JSON.stringify(record) })
        .where(eq(wpUsermeta.umetaId, rows[0].id))
    else
      await tx.insert(wpUsermeta).values({
        userId: ownerId,
        metaKey: PREFIX + input.documentKey,
        metaValue: JSON.stringify(record),
      })
    // Bound abandoned new-post recovery records per account.
    const abandoned = await tx
      .select({ id: wpUsermeta.umetaId })
      .from(wpUsermeta)
      .where(
        and(
          eq(wpUsermeta.userId, ownerId),
          like(wpUsermeta.metaKey, PREFIX.replaceAll("_", "\\_") + "new:%")
        )
      )
      .orderBy(desc(wpUsermeta.umetaId))
      .offset(30)
    for (const row of abandoned)
      await tx.delete(wpUsermeta).where(eq(wpUsermeta.umetaId, row.id))
    return record
  })
}

export async function deletePostAutosave(
  ownerId: string,
  documentKey: string,
  version?: number,
  database: DB = db
) {
  const session = await verifyPostEditor()
  if (session.user.id !== ownerId) throw new PostAutosaveError("forbidden", 403)
  documentKey = autosaveDocumentKey.parse(documentKey)
  if (version !== undefined && (!Number.isSafeInteger(version) || version < 1))
    throw new PostAutosaveError("conflict", 409)
  await database.transaction(async (tx) => {
    await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, ownerId))
      .for("update")
    const rows = await tx
      .select({ id: wpUsermeta.umetaId, value: wpUsermeta.metaValue })
      .from(wpUsermeta)
      .where(
        and(
          eq(wpUsermeta.userId, ownerId),
          eq(wpUsermeta.metaKey, PREFIX + documentKey)
        )
      )
    for (const row of rows)
      if (
        version === undefined ||
        readPostAutosave(row.value)?.version === version
      )
        await tx.delete(wpUsermeta).where(eq(wpUsermeta.umetaId, row.id))
  })
}
