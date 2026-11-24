import "server-only"
import { randomUUID } from "node:crypto"
import { and, asc, count, eq, ilike, ne, or, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import { verifyAdmin } from "@/lib/authMIddleware"
import { checkCmsRateLimit } from "@/lib/rate-limit"
import {
  wpTerms,
  wpTermTaxonomy,
  wpTermmeta,
  wpTermRelationships,
} from "@/db/schema/cms-taxonomy"
import {
  languagesTable,
  termTranslationsTable,
} from "@/db/schema/cms-languages"
import { wpPosts } from "@/db/schema/cms-posts"
import {
  podcastShowIdSchema,
  podcastShowSchema,
  podcastShowQuerySchema,
  podcastShowMetadataSchema,
  type SelectPodcastShow,
} from "@/db/schema/cms-podcasts"

const taxonomy = "podcast_show"
const metaKey = "_pressforge_podcast_show"
export class PodcastShowError extends Error {}

function readMetadata(value: string | null) {
  try {
    return podcastShowMetadataSchema.parse(JSON.parse(value || "{}"))
  } catch {
    return podcastShowMetadataSchema.parse({})
  }
}

export async function listPodcastShows(
  options: unknown = {},
  database: DB = db
) {
  await verifyAdmin()
  const query = podcastShowQuerySchema.parse(options)
  const conditions = [eq(wpTermTaxonomy.taxonomy, taxonomy)]
  if (query.id) conditions.push(eq(wpTerms.termId, BigInt(query.id)))
  if (query.language !== "all")
    conditions.push(eq(termTranslationsTable.languageCode, query.language))
  if (query.search)
    conditions.push(
      or(
        ilike(wpTerms.name, `%${query.search}%`),
        ilike(wpTerms.slug, `%${query.search}%`)
      )!
    )
  const [total] = await database
    .select({ total: count() })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .leftJoin(
      termTranslationsTable,
      eq(termTranslationsTable.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
    )
    .where(and(...conditions))
  const page = Math.min(query.page, Math.max(1, Math.ceil((total?.total || 0) / 20)))
  const rows = await database
    .select({
      id: wpTerms.termId,
      taxonomyId: wpTermTaxonomy.termTaxonomyId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      description: wpTermTaxonomy.description,
      languageCode: termTranslationsTable.languageCode,
      metadata: sql<string | null>`left(${wpTermmeta.metaValue}, 10001)`,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .leftJoin(
      termTranslationsTable,
      eq(termTranslationsTable.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
    )
    .leftJoin(
      wpTermmeta,
      and(
        eq(wpTermmeta.termId, wpTerms.termId),
        eq(wpTermmeta.metaKey, metaKey)
      )
    )
    .where(and(...conditions))
    .orderBy(asc(wpTerms.name), asc(wpTerms.termId))
    .limit(20)
    .offset((page - 1) * 20)
  const items: SelectPodcastShow[] = rows.map((row) => ({
    id: String(row.id),
    taxonomyId: String(row.taxonomyId),
    name: row.name,
    slug: row.slug,
    description: row.description,
    languageCode: row.languageCode || "",
    ...readMetadata(row.metadata),
  }))
  return { items, total: total?.total || 0, page }
}

async function lockedShow(id: string, tx: DB) {
  const [row] = await tx
    .select({ id: wpTerms.termId, taxonomyId: wpTermTaxonomy.termTaxonomyId })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTerms.termId, wpTermTaxonomy.termId))
    .where(
      and(eq(wpTerms.termId, BigInt(id)), eq(wpTermTaxonomy.taxonomy, taxonomy))
    )
    .limit(1)
    .for("update")
  if (!row) throw new PodcastShowError("admin.podcasts.error.missing")
  const [shared] = await tx
    .select({ taxonomy: wpTermTaxonomy.taxonomy })
    .from(wpTermTaxonomy)
    .where(
      and(
        eq(wpTermTaxonomy.termId, row.id),
        ne(wpTermTaxonomy.taxonomy, taxonomy)
      )
    )
    .limit(1)
  if (shared) throw new PodcastShowError("admin.podcasts.error.shared")
  return row
}

export async function savePodcastShow(
  input: unknown,
  database: DB = db
): Promise<string> {
  const session = await verifyAdmin()
  const data = podcastShowSchema.parse(input)
  await checkCmsRateLimit(session.user.id, "write")
  return database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:podcasts'))`
    )
    const existing = data.id ? await lockedShow(data.id, tx) : undefined
    const [language] = await tx
      .select({ code: languagesTable.code })
      .from(languagesTable)
      .where(
        and(
          eq(languagesTable.code, data.languageCode),
          eq(languagesTable.isActive, true)
        )
      )
      .limit(1)
    if (!language) throw new PodcastShowError("admin.podcasts.error.language")
    if (data.artworkId) {
      const [image] = await tx
        .select({ id: wpPosts.id })
        .from(wpPosts)
        .where(
          and(
            eq(wpPosts.id, BigInt(data.artworkId)),
            eq(wpPosts.postType, "attachment"),
            ne(wpPosts.postStatus, "trash"),
            ilike(wpPosts.postMimeType, "image/%")
          )
        )
        .limit(1)
      if (!image) throw new PodcastShowError("admin.podcasts.error.artwork")
    }
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_-]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 200)
    if (!slug) throw new PodcastShowError("admin.podcasts.error.invalid")
    const [duplicate] = await tx
      .select({ id: wpTerms.termId })
      .from(wpTerms)
      .where(
        and(
          eq(wpTerms.slug, slug),
          existing ? ne(wpTerms.termId, existing.id) : undefined
        )
      )
      .limit(1)
    if (duplicate) throw new PodcastShowError("admin.podcasts.error.slug")
    let id: bigint, taxonomyId: bigint
    if (existing) {
      id = existing.id
      taxonomyId = existing.taxonomyId
      await tx
        .update(wpTerms)
        .set({ name: data.name, slug })
        .where(eq(wpTerms.termId, id))
      await tx
        .update(wpTermTaxonomy)
        .set({ description: data.description })
        .where(
          and(
            eq(wpTermTaxonomy.termTaxonomyId, taxonomyId),
            eq(wpTermTaxonomy.taxonomy, taxonomy)
          )
        )
      await tx
        .delete(wpTermmeta)
        .where(and(eq(wpTermmeta.termId, id), eq(wpTermmeta.metaKey, metaKey)))
    } else {
      const [term] = await tx
        .insert(wpTerms)
        .values({ name: data.name, slug })
        .returning({ termId: wpTerms.termId })
      id = term.termId
      const [tax] = await tx
        .insert(wpTermTaxonomy)
        .values({ termId: id, taxonomy, description: data.description })
        .returning({ termTaxonomyId: wpTermTaxonomy.termTaxonomyId })
      taxonomyId = tax.termTaxonomyId
    }
    await tx
      .insert(termTranslationsTable)
      .values({
        termTaxonomyId: taxonomyId,
        languageCode: data.languageCode,
        translationGroupId: randomUUID(),
      })
      .onConflictDoUpdate({
        target: termTranslationsTable.termTaxonomyId,
        set: { languageCode: data.languageCode, updatedAt: new Date() },
      })
    await tx
      .insert(wpTermmeta)
      .values({
        termId: id,
        metaKey,
        metaValue: JSON.stringify(podcastShowMetadataSchema.parse(data)),
      })
    return String(id)
  })
}

export async function deletePodcastShow(input: unknown, database: DB = db) {
  const session = await verifyAdmin()
  const id = podcastShowIdSchema.parse(input)
  await checkCmsRateLimit(session.user.id, "write")
  await database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:podcasts'))`
    )
    const show = await lockedShow(id, tx)
    const [used] = await tx
      .select({ id: wpTermRelationships.objectId })
      .from(wpTermRelationships)
      .where(eq(wpTermRelationships.termTaxonomyId, show.taxonomyId))
      .limit(1)
    if (used) throw new PodcastShowError("admin.podcasts.error.used")
    await tx
      .delete(wpTermTaxonomy)
      .where(
        and(
          eq(wpTermTaxonomy.termTaxonomyId, show.taxonomyId),
          eq(wpTermTaxonomy.taxonomy, taxonomy)
        )
      )
    await tx.delete(wpTerms).where(eq(wpTerms.termId, show.id))
  })
}
