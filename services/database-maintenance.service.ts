import { db, pool } from "@/db";
import {
  wpPosts,
  wpPostmeta,
  wpOptions,
  wpComments,
  wpTerms,
  wpTermRelationships,
} from "@/db/schema";
import { eq, sql, inArray, like, and, lt } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export interface SearchReplaceOptions {
  search: string;
  replace: string;
  tables?: string[];
  dryRun?: boolean;
}

export interface SearchReplaceFieldResult {
  table: string;
  field: string;
  matchedCount: number;
}

export interface SearchReplaceResult {
  success: boolean;
  dryRun: boolean;
  search: string;
  replace: string;
  totalMatches: number;
  fields: SearchReplaceFieldResult[];
}

/**
 * Safely search and replace strings across WordPress tables including JSON fields
 */
export async function searchAndReplace({
  search,
  replace,
  tables = ["wp_posts", "wp_postmeta", "wp_options", "wp_comments"],
  dryRun = true,
}: SearchReplaceOptions): Promise<SearchReplaceResult> {
  if (!search) {
    throw new Error("Search string cannot be empty.");
  }

  const results: SearchReplaceFieldResult[] = [];
  let totalMatches = 0;

  // 1. wp_posts
  if (tables.includes("wp_posts")) {
    const postFields = ["post_content", "post_title", "post_excerpt", "guid"];
    for (const field of postFields) {
      const countRes = await db.execute(
        sql.raw(
          `SELECT COUNT(*)::int as count FROM "wp_posts" WHERE "${field}" LIKE '%${search.replace(/'/g, "''")}%'`
        )
      );
      const count = Number(countRes.rows[0]?.count || 0);
      if (count > 0) {
        totalMatches += count;
        results.push({ table: "wp_posts", field, matchedCount: count });
        if (!dryRun) {
          await db.execute(
            sql.raw(
              `UPDATE "wp_posts" SET "${field}" = REPLACE("${field}", '${search.replace(/'/g, "''")}', '${replace.replace(/'/g, "''")}') WHERE "${field}" LIKE '%${search.replace(/'/g, "''")}%'`
            )
          );
        }
      }
    }
  }

  // 2. wp_postmeta
  if (tables.includes("wp_postmeta")) {
    const countRes = await db.execute(
      sql.raw(
        `SELECT COUNT(*)::int as count FROM "wp_postmeta" WHERE "meta_value" LIKE '%${search.replace(/'/g, "''")}%'`
      )
    );
    const count = Number(countRes.rows[0]?.count || 0);
    if (count > 0) {
      totalMatches += count;
      results.push({ table: "wp_postmeta", field: "meta_value", matchedCount: count });
      if (!dryRun) {
        await db.execute(
          sql.raw(
            `UPDATE "wp_postmeta" SET "meta_value" = REPLACE("meta_value", '${search.replace(/'/g, "''")}', '${replace.replace(/'/g, "''")}') WHERE "meta_value" LIKE '%${search.replace(/'/g, "''")}%'`
          )
        );
      }
    }
  }

  // 3. wp_comments
  if (tables.includes("wp_comments")) {
    const commentFields = ["comment_content", "comment_author_url"];
    for (const field of commentFields) {
      const countRes = await db.execute(
        sql.raw(
          `SELECT COUNT(*)::int as count FROM "wp_comments" WHERE "${field}" LIKE '%${search.replace(/'/g, "''")}%'`
        )
      );
      const count = Number(countRes.rows[0]?.count || 0);
      if (count > 0) {
        totalMatches += count;
        results.push({ table: "wp_comments", field, matchedCount: count });
        if (!dryRun) {
          await db.execute(
            sql.raw(
              `UPDATE "wp_comments" SET "${field}" = REPLACE("${field}", '${search.replace(/'/g, "''")}', '${replace.replace(/'/g, "''")}') WHERE "${field}" LIKE '%${search.replace(/'/g, "''")}%'`
            )
          );
        }
      }
    }
  }

  // 4. wp_options (safely handles strings and JSON structures)
  if (tables.includes("wp_options")) {
    const matchedOptions = await db
      .select({
        optionId: wpOptions.optionId,
        optionName: wpOptions.optionName,
        optionValue: wpOptions.optionValue,
      })
      .from(wpOptions)
      .where(sql`${wpOptions.optionValue} LIKE ${`%${search}%`}`);

    if (matchedOptions.length > 0) {
      totalMatches += matchedOptions.length;
      results.push({
        table: "wp_options",
        field: "option_value",
        matchedCount: matchedOptions.length,
      });

      if (!dryRun) {
        for (const opt of matchedOptions) {
          let updatedVal = opt.optionValue;
          // Check if valid JSON
          try {
            const parsed = JSON.parse(opt.optionValue);
            const replacedJsonStr = JSON.stringify(parsed).split(search).join(replace);
            // Verify valid JSON after replacement
            JSON.parse(replacedJsonStr);
            updatedVal = replacedJsonStr;
          } catch {
            // Raw text replacement
            updatedVal = opt.optionValue.split(search).join(replace);
          }

          await db
            .update(wpOptions)
            .set({ optionValue: updatedVal })
            .where(eq(wpOptions.optionId, opt.optionId));
        }
      }
    }
  }

  return {
    success: true,
    dryRun,
    search,
    replace,
    totalMatches,
    fields: results,
  };
}

export interface CleanupStats {
  revisions: number;
  autoDrafts: number;
  spamComments: number;
  trashedComments: number;
  orphanedPostMeta: number;
  orphanedTermRelationships: number;
  expiredTransients: number;
}

/**
 * Calculates numbers of cleanup candidates in database
 */
export async function getDatabaseCleanupStats(): Promise<CleanupStats> {
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
      sql`SELECT COUNT(*)::int as count FROM "wp_posts" WHERE "post_status" = 'auto-draft'`
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
      sql`SELECT COUNT(*)::int as count FROM "wp_options" WHERE "option_name" LIKE '_transient_timeout_%' AND "option_value"::bigint < ${Math.floor(Date.now() / 1000)}`
    ),
  ]);

  return {
    revisions: Number(revisionsRes.rows[0]?.count || 0),
    autoDrafts: Number(autoDraftsRes.rows[0]?.count || 0),
    spamComments: Number(spamCommentsRes.rows[0]?.count || 0),
    trashedComments: Number(trashedCommentsRes.rows[0]?.count || 0),
    orphanedPostMeta: Number(orphanedMetaRes.rows[0]?.count || 0),
    orphanedTermRelationships: Number(orphanedTermsRes.rows[0]?.count || 0),
    expiredTransients: Number(expiredTransientsRes.rows[0]?.count || 0),
  };
}

/**
 * Executes cleanup operations and runs PostgreSQL VACUUM ANALYZE
 */
export async function runDatabaseCleanup(actions: string[]): Promise<{
  success: boolean;
  cleanedCount: number;
  vacuumRun: boolean;
  details: Record<string, number>;
}> {
  let cleanedCount = 0;
  const details: Record<string, number> = {};
  let vacuumRun = false;

  // 1. Post Revisions
  if (actions.includes("revisions")) {
    const res = await db.execute(
      sql`DELETE FROM "wp_posts" WHERE "post_type" = 'revision'`
    );
    const count = Number(res.rowCount || 0);
    details["revisions"] = count;
    cleanedCount += count;
  }

  // 2. Auto Drafts
  if (actions.includes("auto_drafts")) {
    const res = await db.execute(
      sql`DELETE FROM "wp_posts" WHERE "post_status" = 'auto-draft'`
    );
    const count = Number(res.rowCount || 0);
    details["auto_drafts"] = count;
    cleanedCount += count;
  }

  // 3. Spam & Trashed Comments
  if (actions.includes("spam_comments")) {
    const res = await db.execute(
      sql`DELETE FROM "wp_comments" WHERE "comment_approved" IN ('spam', 'trash')`
    );
    const count = Number(res.rowCount || 0);
    details["spam_comments"] = count;
    cleanedCount += count;
  }

  // 4. Orphaned Post Meta
  if (actions.includes("orphaned_meta")) {
    const res = await db.execute(
      sql`DELETE FROM "wp_postmeta" WHERE "post_id" NOT IN (SELECT "ID" FROM "wp_posts")`
    );
    const count = Number(res.rowCount || 0);
    details["orphaned_meta"] = count;
    cleanedCount += count;
  }

  // 5. Orphaned Term Relationships
  if (actions.includes("orphaned_terms")) {
    const res = await db.execute(
      sql`DELETE FROM "wp_term_relationships" WHERE "object_id" NOT IN (SELECT "ID" FROM "wp_posts")`
    );
    const count = Number(res.rowCount || 0);
    details["orphaned_terms"] = count;
    cleanedCount += count;
  }

  // 6. Expired Transients
  if (actions.includes("transients")) {
    const nowSec = Math.floor(Date.now() / 1000);
    const expiredKeysRes = await db.execute(
      sql`SELECT "option_name" FROM "wp_options" WHERE "option_name" LIKE '_transient_timeout_%' AND "option_value"::bigint < ${nowSec}`
    );

    let transCount = 0;
    for (const row of expiredKeysRes.rows) {
      const timeoutName = String(row.option_name);
      const transientName = timeoutName.replace("_timeout_", "_");
      await db.execute(
        sql`DELETE FROM "wp_options" WHERE "option_name" IN (${timeoutName}, ${transientName})`
      );
      transCount++;
    }
    details["transients"] = transCount;
    cleanedCount += transCount;
  }

  // 7. Vacuum / Analyze PostgreSQL Database
  if (actions.includes("vacuum")) {
    // VACUUM cannot run inside a transaction block, run directly via client
    const client = await pool.connect();
    try {
      await client.query("VACUUM (ANALYZE)");
      vacuumRun = true;
    } finally {
      client.release();
    }
  }

  return {
    success: true,
    cleanedCount,
    vacuumRun,
    details,
  };
}

export interface SiteHealthData {
  database: {
    version: string;
    size: string;
    serverTime: string;
    totalTables: number;
    activeConnections: number;
    status: "good" | "warning";
  };
  server: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: string;
    memoryHeapUsed: string;
    memoryHeapTotal: string;
    memoryRss: string;
  };
  storage: {
    uploadsDir: string;
    exists: boolean;
    writable: boolean;
    fileCount: number;
    totalSize: string;
  };
  security: {
    https: boolean;
    envConfigured: boolean;
    nodeEnv: string;
    dbSsl: boolean;
  };
}

/**
 * Gathers live diagnostic metrics for Site Health
 */
export async function getSiteHealthData(): Promise<SiteHealthData> {
  // 1. PostgreSQL Diagnostics
  const [versionRes, sizeRes, connRes, tablesRes] = await Promise.all([
    db.execute(sql`SELECT version() as version, NOW() as now`),
    db.execute(
      sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    ),
    db.execute(
      sql`SELECT count(*)::int as connections FROM pg_stat_activity WHERE datname = current_database()`
    ),
    db.execute(
      sql`SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public'`
    ),
  ]);

  const rawVersion = String(versionRes.rows[0]?.version || "");
  const serverTime = String(versionRes.rows[0]?.now || new Date().toISOString());
  const dbSize = String(sizeRes.rows[0]?.size || "Unknown");
  const activeConnections = Number(connRes.rows[0]?.connections || 1);
  const totalTables = Number(tablesRes.rows[0]?.count || 0);

  // 2. Node & System Metrics
  const mem = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  // 3. Storage Directory Metrics
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  let exists = false;
  let writable = false;
  let fileCount = 0;
  let totalBytes = 0;

  try {
    const stats = await fs.stat(uploadsDir);
    exists = stats.isDirectory();
    if (exists) {
      await fs.access(uploadsDir, fs.constants.W_OK);
      writable = true;

      const files = await fs.readdir(uploadsDir);
      fileCount = files.length;
      for (const f of files.slice(0, 100)) {
        try {
          const fStat = await fs.stat(path.join(uploadsDir, f));
          totalBytes += fStat.size;
        } catch {
          // ignore individual file stat error
        }
      }
    }
  } catch {
    exists = false;
    writable = false;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return {
    database: {
      version: rawVersion.split("on")[0]?.trim() || rawVersion,
      size: dbSize,
      serverTime,
      totalTables,
      activeConnections,
      status: "good",
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
      totalSize: formatBytes(totalBytes),
    },
    security: {
      https: process.env.NODE_ENV === "production",
      envConfigured: Boolean(process.env.DATABASE_URL),
      nodeEnv: process.env.NODE_ENV || "development",
      dbSsl: process.env.DATABASE_URL?.includes("sslmode") ?? false,
    },
  };
}
