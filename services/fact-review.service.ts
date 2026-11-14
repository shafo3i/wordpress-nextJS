import "server-only"
import { createHash } from "node:crypto"
import { and, desc, eq, ilike, or } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpPosts, wpPostmeta } from "@/db/schema"
import {
  factPostIdSchema,
  factReviewSchema,
  factReviewHistorySchema,
  type FactReviewInput,
  type FactReviewRecord,
} from "@/db/schema/cms-fact-reviews"

const KEY = "_cms_fact_review_history"
export const factSourceHash = (post: {
  postTitle: string
  postContent: string
  postExcerpt: string
}) =>
  createHash("sha256")
    .update(
      JSON.stringify([post.postTitle, post.postContent, post.postExcerpt])
    )
    .digest("hex")
function parseHistory(raw?: string | null): FactReviewRecord[] {
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed))
    throw new Error("admin.plugins.fact.invalid_record")
  return factReviewHistorySchema.parse(parsed)
}
export async function findFactReviewPosts(search: string, database: DB = db) {
  return database
    .select({ id: wpPosts.id, title: wpPosts.postTitle })
    .from(wpPosts)
    .where(
      and(
        eq(wpPosts.postType, "post"),
        search
          ? or(
              ilike(wpPosts.postTitle, `%${search.slice(0, 100)}%`),
              eq(wpPosts.postName, search.slice(0, 200))
            )
          : undefined
      )
    )
    .orderBy(desc(wpPosts.postDate), desc(wpPosts.id))
    .limit(30)
    .then((rows) => rows.map((p) => ({ ...p, id: p.id.toString() })))
}
export async function getFactReview(postId: string, database: DB = db) {
  const id = BigInt(factPostIdSchema.parse(postId))
  const [post] = await database
    .select()
    .from(wpPosts)
    .where(and(eq(wpPosts.id, id), eq(wpPosts.postType, "post")))
    .limit(1)
  if (!post) throw new Error("admin.plugins.fact.not_found")
  const [meta] = await database
    .select()
    .from(wpPostmeta)
    .where(and(eq(wpPostmeta.postId, id), eq(wpPostmeta.metaKey, KEY)))
    .limit(1)
  const history = parseHistory(meta?.metaValue)
  return {
    postId,
    title: post.postTitle,
    sourceHash: factSourceHash(post),
    current: history.length ? history[0] : null,
    history,
  }
}
export async function saveFactReview(
  input: FactReviewInput,
  reviewer: { id: string; name: string },
  database: DB = db
) {
  const { verifyPluginAdministrator } =
    await import("@/lib/plugins/authorization")
  const session = await verifyPluginAdministrator()
  reviewer = { id: session.user.id, name: session.user.name || "" }
  const value = factReviewSchema.parse(input)
  return database.transaction(async (tx) => {
    const id = BigInt(value.postId)
    const [post] = await tx
      .select()
      .from(wpPosts)
      .where(and(eq(wpPosts.id, id), eq(wpPosts.postType, "post")))
      .for("update")
      .limit(1)
    if (!post || factSourceHash(post) !== value.sourceHash)
      throw new Error("admin.plugins.fact.source_changed")
    const condition = and(
      eq(wpPostmeta.postId, id),
      eq(wpPostmeta.metaKey, KEY)
    )
    const [meta] = await tx.select().from(wpPostmeta).where(condition).limit(1)
    const history = parseHistory(meta?.metaValue)
    if ((history[0]?.version || 0) !== value.expectedVersion)
      throw new Error("admin.plugins.fact.conflict")
    const record: FactReviewRecord = {
      claim: value.claim,
      summary: value.summary,
      sources: value.sources,
      status: value.status,
      sourceHash: value.sourceHash,
      version: value.expectedVersion + 1,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewedAt: new Date().toISOString(),
      approved:
        value.approve && !["unreviewed", "in_review"].includes(value.status),
    }
    const metaValue = JSON.stringify([record, ...history])
    if (meta) await tx.update(wpPostmeta).set({ metaValue }).where(condition)
    else
      await tx
        .insert(wpPostmeta)
        .values({ postId: id, metaKey: KEY, metaValue })
    return record
  })
}
export function publicFactReview(
  data: Awaited<ReturnType<typeof getFactReview>>
) {
  const record = data.current
  return record?.approved &&
    !["unreviewed", "in_review"].includes(record.status) &&
    record.sourceHash === data.sourceHash &&
    record.sources.length &&
    record.claim &&
    record.summary
    ? record
    : null
}
