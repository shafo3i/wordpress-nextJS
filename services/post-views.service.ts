import { randomUUID } from "node:crypto"
import { and, eq, inArray, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpPosts, wpPostmeta } from "@/db/schema"
import { VIEW_WINDOW_MS } from "@/lib/post-view-token"

export const postViewsExpression = sql<number>`COALESCE((SELECT COALESCE(
  MAX(CASE WHEN pv.meta_key='post_views_count' AND pv.meta_value ~ '^[0-9]{1,15}$' THEN pv.meta_value::bigint END),
  MAX(CASE WHEN pv.meta_key='_legatus_post_views_count' AND pv.meta_value ~ '^[0-9]{1,15}$' THEN pv.meta_value::bigint END)
) FROM wp_postmeta pv WHERE pv.post_id=${wpPosts.id} AND pv.meta_key IN ('post_views_count','_legatus_post_views_count')),0)`

export async function getPostViewCounts(
  ids: (string | bigint)[],
  database: DB = db,
  publishedOnly = false
) {
  if (!ids.length) return new Map<string, number>()
  const rows = await database
    .select({ id: wpPosts.id, views: postViewsExpression })
    .from(wpPosts)
    .where(
      and(
        inArray(
          wpPosts.id,
          ids.map((id) => BigInt(id))
        ),
        publishedOnly
          ? and(eq(wpPosts.postType, "post"), eq(wpPosts.postStatus, "publish"))
          : undefined
      )
    )
  return new Map(rows.map((row) => [String(row.id), Number(row.views)]))
}

let lastCleanup = 0
/** Row lock + separate statements preserve increments under concurrent transaction pooling. */
export async function recordPostView(
  postId: bigint,
  visitorHash: string,
  requestHash: string,
  database: DB = db,
  now = Date.now()
) {
  return database.transaction(async (tx) => {
    const [post] = await tx
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .where(
        and(
          eq(wpPosts.id, postId),
          eq(wpPosts.postType, "post"),
          eq(wpPosts.postStatus, "publish")
        )
      )
      .for("update")
    if (!post) return null
    const [{ views }] = await tx
      .select({ views: postViewsExpression })
      .from(wpPosts)
      .where(eq(wpPosts.id, postId))
    const previous = Number(views)
    // Limit cookie-reset abuse without storing raw IPs or user agents.
    const requestGate =
      await tx.execute(sql`INSERT INTO rate_limit(id,key,count,last_request) VALUES (${randomUUID()},${`post-view:request:${requestHash}`},1,${now})
      ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limit.last_request < ${now - 60000} THEN 1 ELSE rate_limit.count+1 END,
      last_request=CASE WHEN rate_limit.last_request < ${now - 60000} THEN ${now} ELSE rate_limit.last_request END
      RETURNING count`)
    if (Number(requestGate.rows[0]?.count) > 60)
      return { views: previous, counted: false }
    const gate =
      await tx.execute(sql`INSERT INTO rate_limit(id,key,count,last_request) VALUES (${randomUUID()},${`post-view:visit:${postId}:${visitorHash}`},1,${now})
      ON CONFLICT(key) DO UPDATE SET last_request=EXCLUDED.last_request WHERE rate_limit.last_request <= ${now - VIEW_WINDOW_MS} RETURNING id`)
    if (!gate.rowCount) return { views: previous, counted: false }
    const next = Math.min(previous + 1, 999999999999999)
    const [existing] = await tx
      .select({ id: wpPostmeta.metaId })
      .from(wpPostmeta)
      .where(
        and(
          eq(wpPostmeta.postId, postId),
          eq(wpPostmeta.metaKey, "post_views_count")
        )
      )
      .orderBy(wpPostmeta.metaId)
      .limit(1)
    if (existing)
      await tx
        .update(wpPostmeta)
        .set({ metaValue: String(next) })
        .where(eq(wpPostmeta.metaId, existing.id))
    else
      await tx.insert(wpPostmeta).values({
        postId,
        metaKey: "post_views_count",
        metaValue: String(next),
      })
    if (now - lastCleanup > 300000) {
      await tx.execute(
        sql`DELETE FROM rate_limit WHERE id IN (SELECT id FROM rate_limit WHERE key LIKE 'post-view:%' AND last_request < ${now - 86400000} LIMIT 200)`
      )
      lastCleanup = now
    }
    return { views: next, counted: true }
  })
}
