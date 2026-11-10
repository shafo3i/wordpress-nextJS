import { and, desc, eq, lte, ne, notInArray, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpPosts, postTranslationsTable, languagesTable } from "@/db/schema"
import { factPostIdSchema } from "@/db/schema/cms-fact-reviews"
export async function getRelatedPublishedPostIds(
  postId: string,
  limit: number,
  strategy: "categories" | "tags" | "recent",
  language: string,
  database: DB = db
) {
  const id = BigInt(factPostIdSchema.parse(postId))
  limit = Number.isFinite(limit)
    ? Math.min(12, Math.max(1, Math.trunc(limit)))
    : 3
  const conditions = [
    eq(wpPosts.postType, "post"),
    eq(wpPosts.postStatus, "publish"),
    eq(wpPosts.postPassword, ""),
    lte(wpPosts.postDateGmt, new Date()),
    ne(wpPosts.id, id),
    eq(postTranslationsTable.languageCode, language),
    eq(languagesTable.isActive, true),
  ]
  const read = (matching: boolean, selected: bigint[], count: number) =>
    database
      .select({ id: wpPosts.id })
      .from(wpPosts)
      .innerJoin(
        postTranslationsTable,
        eq(wpPosts.id, postTranslationsTable.postId)
      )
      .innerJoin(
        languagesTable,
        eq(languagesTable.code, postTranslationsTable.languageCode)
      )
      .where(
        and(
          ...conditions,
          selected.length ? notInArray(wpPosts.id, selected) : undefined,
          matching
            ? sql`exists (select 1 from wp_term_relationships candidate join wp_term_taxonomy taxonomy on taxonomy.term_taxonomy_id=candidate.term_taxonomy_id join wp_term_relationships original on original.term_taxonomy_id=candidate.term_taxonomy_id where candidate.object_id=${wpPosts.id} and original.object_id=${id} and taxonomy.taxonomy=${strategy === "tags" ? "post_tag" : "category"})`
            : undefined
        )
      )
      .orderBy(desc(wpPosts.postDateGmt), desc(wpPosts.id))
      .limit(count)
  const matched = strategy === "recent" ? [] : await read(true, [], limit),
    ids = matched.map((r) => r.id)
  if (ids.length < limit)
    ids.push(...(await read(false, ids, limit - ids.length)).map((r) => r.id))
  return ids
}
