import { checkCmsRateLimit } from "@/lib/rate-limit";
import "server-only"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  searchReplaceSchema,
  cleanupActionsSchema,
} from "@/db/schema/cms-tools"
import {
  getMediaOverviewStats,
  getStoredStorageInventory,
} from "./media-tools.service"
import { db, pool } from "@/db"
import { sql } from "drizzle-orm"
import fs from "fs/promises"
import path from "path"

export interface SearchReplaceOptions {
  search: string
  replace: string
  tables?: string[]
  dryRun?: boolean
}

export interface SearchReplaceFieldResult {
  table: string
  field: string
  matchedCount: number
}

export interface SearchReplaceResult {
  success: boolean
  dryRun: boolean
  search: string
  replace: string
  totalMatches: number
  fields: SearchReplaceFieldResult[]
}

/**
 * Safely search and replace strings across WordPress tables including JSON fields
 */
export async function searchAndReplace(
  input: SearchReplaceOptions
): Promise<SearchReplaceResult> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "replace");
  const { search, replace, dryRun, tables } = searchReplaceSchema.parse(input)
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('pressforge:maintenance'))`
    )
    await tx.execute(sql`SET LOCAL statement_timeout = '30s'`)
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`)
    const fields: SearchReplaceFieldResult[] = []
    let totalMatches = 0,
      bytes = 0
    const targets = [
      {
        table: "wp_posts",
        id: "ID",
        fields: ["post_content", "post_title", "post_excerpt", "guid"],
        filter: sql`post_type IN ('post','page','attachment')`,
      },
      {
        table: "wp_comments",
        id: "comment_ID",
        fields: ["comment_content", "comment_author_url"],
        filter: sql`TRUE`,
      },
      {
        table: "wp_postmeta",
        id: "meta_id",
        fields: ["meta_value"],
        filter: sql`meta_key IN ('_wp_attached_file','_wp_attachment_metadata','_featured_video_url','_seo_title','_seo_description','_seo_og_image','_seo_canonical')`,
      },
      {
        table: "wp_options",
        id: "option_id",
        fields: ["option_value"],
        filter: sql`option_name IN ('siteurl','home','blogname','blogdescription','site_identity_translations','sidebars_widgets','pressforge_redirects') OR starts_with(option_name,'theme_mods_') OR starts_with(option_name,'widget_')`,
      },
    ]
    for (const target of targets) {
      if (!tables.includes(target.table as (typeof tables)[number])) continue
      for (const field of target.fields) {
        const result = await tx.execute(
          sql`SELECT ${sql.identifier(target.id)} AS id, ${sql.identifier(field)} AS value FROM ${sql.identifier(target.table)} WHERE (${target.filter}) AND strpos(${sql.identifier(field)}, ${search}) > 0 LIMIT 10001 FOR UPDATE`
        )
        if (result.rows.length > 10000) throw new Error("tools_job_too_large")
        let matchedCount = 0
        for (const row of result.rows) {
          const value = String(row.value || "")
          bytes += Buffer.byteLength(value)
          if (bytes > 50 * 1024 * 1024) throw new Error("tools_job_too_large")
          const updated = replaceStructuredText(value, search, replace)
          if (updated === value) continue
          matchedCount++
          if (!dryRun)
            await tx.execute(
              sql`UPDATE ${sql.identifier(target.table)} SET ${sql.identifier(field)} = ${updated} WHERE ${sql.identifier(target.id)} = ${row.id}`
            )
        }
        if (matchedCount)
          fields.push({ table: target.table, field, matchedCount })
        totalMatches += matchedCount
      }
    }
    return { success: true, dryRun, search, replace, totalMatches, fields }
  })
}
/** Replace JSON string values, never serialized keys/IDs. Refuse PHP byte-length serialization. */
export function replaceStructuredText(
  value: string,
  search: string,
  replacement: string
): string {
  if (/^(?:a|O|s):[0-9]+:/.test(value.trim()))
    throw new Error("tools_serialized_data")
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return value.split(search).join(replacement)
  }
  const walk = (node: unknown, depth: number): unknown => {
    if (depth > 50) throw new Error("tools_nested_data")
    if (typeof node === "string") return node.split(search).join(replacement)
    if (Array.isArray(node)) return node.map((item) => walk(item, depth + 1))
    if (node && typeof node === "object")
      return Object.fromEntries(
        Object.entries(node).map(([key, item]) => [key, walk(item, depth + 1)])
      )
    return node
  }
  return JSON.stringify(walk(parsed, 0))
}

export interface CleanupStats {
  revisions: number
  autoDrafts: number
  spamComments: number
  trashedComments: number
  orphanedPostMeta: number
  orphanedTermRelationships: number
  expiredTransients: number
}

/**
 * Calculates numbers of cleanup candidates in database
 */
export async function getDatabaseCleanupStats(): Promise<CleanupStats> {
  await verifyAdmin()
  const [
    revisionsRes,
    autoDraftsRes,
    spamCommentsRes,
    trashedCommentsRes,
    orphanedMetaRes,
    orphanedTermsRes,
    expiredTransientsRes,
  ] = await Promise.all([
    // Revisions
    db.execute(
      sql`SELECT COUNT(*)::int as count FROM "wp_posts" WHERE "post_type" = 'revision'`
    ),
    // Auto-drafts
    db.execute(
      sql`SELECT COUNT(*)::int as count FROM "wp_posts" WHERE "post_status" = 'auto-draft' AND post_type IN ('post','page') AND post_modified < NOW() - INTERVAL '7 days'`
    ),
    // Spam comments
    db.execute(
      sql`SELECT COUNT(*)::int as count FROM "wp_comments" WHERE "comment_approved" = 'spam'`
    ),
    // Trashed comments
    db.execute(
      sql`SELECT COUNT(*)::int as count FROM "wp_comments" WHERE "comment_approved" = 'trash'`
    ),
    // Orphaned postmeta
    db.execute(
      sql`SELECT COUNT(*)::int as count FROM "wp_postmeta" WHERE "post_id" NOT IN (SELECT "ID" FROM "wp_posts")`
    ),
    // Orphaned term relationships
    db.execute(
      sql`SELECT COUNT(*)::int as count FROM "wp_term_relationships" WHERE "object_id" NOT IN (SELECT "ID" FROM "wp_posts")`
    ),
    // Expired transients
    db.execute(
      sql`SELECT COUNT(*)::int as count FROM "wp_options" WHERE starts_with("option_name", '_transient_timeout_') AND CASE WHEN "option_value" ~ '^[0-9]{1,15}$' THEN "option_value"::bigint ELSE NULL END < ${Math.floor(Date.now() / 1000)}`
    ),
  ])

  return {
    revisions: Number(revisionsRes.rows[0]?.count || 0),
    autoDrafts: Number(autoDraftsRes.rows[0]?.count || 0),
    spamComments: Number(spamCommentsRes.rows[0]?.count || 0),
    trashedComments: Number(trashedCommentsRes.rows[0]?.count || 0),
    orphanedPostMeta: Number(orphanedMetaRes.rows[0]?.count || 0),
    orphanedTermRelationships: Number(orphanedTermsRes.rows[0]?.count || 0),
    expiredTransients: Number(expiredTransientsRes.rows[0]?.count || 0),
  }
}

/**
 * Executes cleanup operations and runs PostgreSQL VACUUM ANALYZE
 */
export async function runDatabaseCleanup(actions: string[]): Promise<{
  success: boolean
  cleanedCount: number
  vacuumRun: boolean
  details: Record<string, number>
}> {
  const rateActor = await verifyAdmin()
  await checkCmsRateLimit(rateActor.user.id, "cleanup");
  const selected = cleanupActionsSchema.parse(actions)
  const result = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('pressforge:maintenance'))`
    )
    await tx.execute(sql`SET LOCAL statement_timeout = '30s'`)
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`)
    const details: Record<string, number> = {}
    const deletedPosts: bigint[] = []
    if (selected.includes("revisions") || selected.includes("auto_drafts")) {
      const rows = await tx.execute(
        sql`SELECT "ID", post_type FROM wp_posts WHERE (${selected.includes("revisions")} AND post_type = 'revision') OR (${selected.includes("auto_drafts")} AND post_status = 'auto-draft' AND post_type IN ('post','page') AND post_modified < NOW() - INTERVAL '7 days') FOR UPDATE`
      )
      for (const row of rows.rows) {
        deletedPosts.push(BigInt(String(row.ID)))
        const key = row.post_type === "revision" ? "revisions" : "auto_drafts"
        details[key] = (details[key] || 0) + 1
      }
      if (deletedPosts.length) {
        const ids = sql.join(
          deletedPosts.map((id) => sql`${id}`),
          sql`, `
        )
        await tx.execute(sql`DELETE FROM wp_postmeta WHERE post_id IN (${ids})`)
        await tx.execute(
          sql`DELETE FROM wp_term_relationships WHERE object_id IN (${ids})`
        )
        await tx.execute(
          sql`UPDATE wp_posts SET post_parent = 0 WHERE post_parent IN (${ids})`
        )
        await tx.execute(sql`DELETE FROM wp_posts WHERE "ID" IN (${ids})`)
      }
    }
    if (selected.includes("spam_comments")) {
      await tx.execute(
        sql`UPDATE wp_comments SET comment_parent = 0 WHERE comment_parent IN (SELECT "comment_ID" FROM wp_comments WHERE comment_approved IN ('spam','trash'))`
      )
      await tx.execute(
        sql`DELETE FROM wp_commentmeta WHERE comment_id IN (SELECT "comment_ID" FROM wp_comments WHERE comment_approved IN ('spam','trash'))`
      )
      const deleted = await tx.execute(
        sql`DELETE FROM wp_comments WHERE comment_approved IN ('spam','trash')`
      )
      details.spam_comments = deleted.rowCount || 0
    }
    if (selected.includes("orphaned_meta"))
      details.orphaned_meta =
        (
          await tx.execute(
            sql`DELETE FROM wp_postmeta WHERE NOT EXISTS (SELECT 1 FROM wp_posts WHERE "ID" = post_id)`
          )
        ).rowCount || 0
    if (selected.includes("orphaned_terms"))
      details.orphaned_terms =
        (
          await tx.execute(
            sql`DELETE FROM wp_term_relationships WHERE NOT EXISTS (SELECT 1 FROM wp_posts WHERE "ID" = object_id)`
          )
        ).rowCount || 0
    if (selected.includes("transients")) {
      const expired = await tx.execute(
        sql`SELECT option_name FROM wp_options WHERE starts_with(option_name,'_transient_timeout_') AND CASE WHEN option_value ~ '^[0-9]{1,15}$' THEN option_value::bigint ELSE NULL END < ${Math.floor(Date.now() / 1000)} FOR UPDATE`
      )
      for (const row of expired.rows) {
        const timeout = String(row.option_name),
          value = timeout.replace("_transient_timeout_", "_transient_")
        await tx.execute(
          sql`DELETE FROM wp_options WHERE option_name IN (${timeout},${value})`
        )
      }
      details.transients = expired.rows.length
    }
    await tx.execute(
      sql`UPDATE wp_term_taxonomy t SET count = (SELECT count(*) FROM wp_term_relationships r JOIN wp_posts p ON p."ID"=r.object_id WHERE r.term_taxonomy_id=t.term_taxonomy_id AND p.post_type='post' AND p.post_status='publish') WHERE t.taxonomy IN ('category','post_tag')`
    )
    return {
      success: true,
      cleanedCount: Object.values(details).reduce(
        (sum, count) => sum + count,
        0
      ),
      vacuumRun: false,
      details,
    }
  })
  if (selected.includes("vacuum")) {
    const client = await pool.connect()
    try {
      await client.query({
        text: "VACUUM (ANALYZE) wp_posts, wp_postmeta, wp_term_relationships, wp_term_taxonomy, wp_comments, wp_commentmeta, wp_options",
      })
      result.vacuumRun = true
    } catch {
      result.details.vacuum_failed = 1
    } finally {
      client.release()
    }
  }
  return result
}

export interface SiteHealthData {
  database: {
    version: string
    size: string
    serverTime: string
    totalTables: number
    activeConnections: number
    status: "good" | "warning"
  }
  server: {
    nodeVersion: string
    platform: string
    arch: string
    uptime: string
    memoryHeapUsed: string
    memoryHeapTotal: string
    memoryRss: string
  }
  storage: {
    uploadsDir: string
    exists: boolean
    writable: boolean
    fileCount: number | null
    totalSize: string | null
    scannedAt?: string | null
    diskFree?: string | null
    diskTotal?: string | null
  }
  security: {
    https: boolean
    envConfigured: boolean
    nodeEnv: string
    dbSsl: boolean
  }
}

/**
 * Gathers live diagnostic metrics for Site Health
 */
export async function getSiteHealthData({
  includeStorageInventory = false,
}: { includeStorageInventory?: boolean } = {}): Promise<SiteHealthData> {
  await verifyAdmin()
  // 1. PostgreSQL Diagnostics
  const [versionRes, sizeRes, connRes, tablesRes] = await Promise.all([
    db.execute(
      sql`SELECT version() as version, NOW() as now, current_setting('max_connections')::int as max_connections`
    ),
    db.execute(
      sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    ),
    db.execute(
      sql`SELECT count(*)::int as connections FROM pg_stat_activity WHERE datname = current_database()`
    ),
    db.execute(
      sql`SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public'`
    ),
  ])

  const rawVersion = String(versionRes.rows[0]?.version || "")
  const serverTime = String(versionRes.rows[0]?.now || new Date().toISOString())
  const dbSize = String(sizeRes.rows[0]?.size || "Unknown")
  const activeConnections = Number(connRes.rows[0]?.connections || 1)
  const totalTables = Number(tablesRes.rows[0]?.count || 0)

  // 2. Node & System Metrics
  const ssl = await db.execute(
    sql`SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid()`
  )
  const mem = process.memoryUsage()
  const uptimeSeconds = Math.floor(process.uptime())
  const hours = Math.floor(uptimeSeconds / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)

  // 3. Storage Directory Metrics
  let exists = false,
    writable = false,
    fileCount: number | null = includeStorageInventory ? 0 : null,
    totalBytes: number | null = includeStorageInventory ? 0 : null
  let scannedAt: string | null = null
  let diskFree: number | null = null,
    diskTotal: number | null = null
  if (!includeStorageInventory) {
    const stored = await getStoredStorageInventory()
    if (stored) {
      fileCount = stored.fileCount
      totalBytes = stored.totalBytes
      scannedAt = stored.scannedAt
    }
  }
  try {
    await fs.access(path.join(process.cwd(), "public", "uploads"))
    exists = true
    if (includeStorageInventory) {
      const inventory = await getMediaOverviewStats({ scanFiles: true })
      writable = inventory.uploadsDirWritable
      fileCount = inventory.physicalFilesCount
      totalBytes = inventory.totalDiskUsageBytes
      scannedAt = inventory.scannedAt ?? null
    } else {
      // Dashboard navigation must not wait for a recursive media-library scan.
      await fs.access(
        path.join(process.cwd(), "public", "uploads"),
        fs.constants.W_OK
      )
      writable = true
    }
    if (typeof fs.statfs === "function") {
      try {
        const disk = await fs.statfs(
          path.join(process.cwd(), "public", "uploads")
        )
        const available = disk.bavail * disk.bsize,
          total = disk.blocks * disk.bsize
        if (Number.isSafeInteger(available) && Number.isSafeInteger(total)) {
          diskFree = available
          diskTotal = total
        }
      } catch {
        /* Disk-capacity reporting is optional; it must not trigger an inventory. */
      }
    }
  } catch (error) {
    if (
      !["ENOENT", "EACCES"].includes(
        (error as NodeJS.ErrnoException).code || ""
      )
    )
      throw error
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return {
    database: {
      version: rawVersion.split("on")[0]?.trim() || rawVersion,
      size: dbSize,
      serverTime,
      totalTables,
      activeConnections,
      status:
        activeConnections >=
        Number(versionRes.rows[0]?.max_connections || 100) * 0.8
          ? "warning"
          : "good",
    },
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: `${hours}h ${minutes}m`,
      memoryHeapUsed: formatBytes(mem.heapUsed),
      memoryHeapTotal: formatBytes(mem.heapTotal),
      memoryRss: formatBytes(mem.rss),
    },
    storage: {
      uploadsDir: "public/uploads",
      exists,
      writable,
      fileCount,
      totalSize: totalBytes === null ? null : formatBytes(totalBytes),
      scannedAt,
      diskFree: diskFree === null ? null : formatBytes(diskFree),
      diskTotal: diskTotal === null ? null : formatBytes(diskTotal),
    },
    security: {
      https: (process.env.BETTER_AUTH_URL || "").startsWith("https://"),
      envConfigured: Boolean(
        process.env.DATABASE_URL &&
        process.env.BETTER_AUTH_SECRET &&
        process.env.BETTER_AUTH_URL
      ),
      nodeEnv: process.env.NODE_ENV || "development",
      dbSsl: ssl.rows[0]?.ssl === true,
    },
  }
}
