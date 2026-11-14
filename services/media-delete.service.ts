import "server-only";
import { verifyPostEditor } from "@/lib/authMIddleware";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db, type DB } from "@/db";
import { wpPosts, wpPostmeta } from "@/db/schema";
import { mediaDeleteIdsSchema } from "@/db/schema/cms-media-details";
import { checkedMediaPath, mediaRoot, mediaPathParts } from "@/lib/media-files";
import { MediaUploadError } from "@/lib/media-upload";
export async function deleteMediaItems(ids: number[], database: DB = db): Promise<{ deletedCount: number; cleanupPending?: number }> {
  await verifyPostEditor();
  const parsed = mediaDeleteIdsSchema.parse(ids).map(BigInt);
  const files = new Set<string>(); let cleanupPending = 0;
  const deletedCount = await database.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:media'))`);
    const attachments = await tx.select({ id: wpPosts.id }).from(wpPosts)
      .where(and(inArray(wpPosts.id, parsed), eq(wpPosts.postType, "attachment"))).for("update");
    if (attachments.length !== parsed.length) throw new MediaUploadError("admin.media.details_not_found");
    const metas = await tx.select({ id: wpPostmeta.postId, key: wpPostmeta.metaKey, value: sql<string>`left(${wpPostmeta.metaValue}, 100001)` }).from(wpPostmeta)
      .where(and(inArray(wpPostmeta.postId, parsed), inArray(wpPostmeta.metaKey, ["_wp_attached_file", "_wp_attachment_metadata"])));
    const byAttachment = new Map<string, { original: string; paths: Set<string> }>();
    for (const attachment of attachments) {
      const values = metas.filter(row => row.id === attachment.id);
      const original = values.find(row => row.key === "_wp_attached_file")?.value;
      if (!original) continue;
      try { mediaPathParts(original); } catch { cleanupPending++; continue; }
      const paths = new Set([original]);
      const rawMetadata = values.find(row => row.key === "_wp_attachment_metadata")?.value;
      if (rawMetadata) try {
        if (rawMetadata.length > 100000) throw new Error();
        const metadata: unknown = JSON.parse(rawMetadata);
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error();
        const sizes = (metadata as { sizes?: unknown }).sizes;
        if (sizes && typeof sizes === "object" && !Array.isArray(sizes)) {
          const entries = Object.values(sizes);
          if (entries.length > 64) throw new Error();
          for (const raw of entries) {
            if (!raw || typeof raw !== "object" || typeof (raw as { file?: unknown }).file !== "string") continue;
            const filename = (raw as { file: string }).file;
            if (filename !== path.basename(filename)) { cleanupPending++; continue; }
            const originalStem = path.posix.basename(original, path.posix.extname(original));
            if (!filename.startsWith(`${originalStem}-`) || !/-\d+x\d+\.(?:jpe?g|png|webp|gif|avif)$/i.test(filename)) { cleanupPending++; continue; }
            const relative = path.posix.join(path.posix.dirname(original), filename);
            try {
              mediaPathParts(relative);
              paths.add(relative);
              paths.add(relative.replace(/\.[^.]+$/, ".webp"));
            } catch { cleanupPending++; }
          }
        }
      } catch { cleanupPending++; }
      byAttachment.set(attachment.id.toString(), { original, paths });
    }
    const candidates = [...new Set([...byAttachment.values()].flatMap(item => [...item.paths]))];
    const shared = candidates.length ? await tx.select({ file: wpPostmeta.metaValue }).from(wpPostmeta)
      .innerJoin(wpPosts, eq(wpPosts.id, wpPostmeta.postId))
      .where(and(eq(wpPosts.postType, "attachment"), notInArray(wpPosts.id, parsed), eq(wpPostmeta.metaKey, "_wp_attached_file"), inArray(wpPostmeta.metaValue, candidates))) : [];
    const references = new Set(shared.map(row => row.file));
    for (const item of byAttachment.values()) if (!references.has(item.original)) for (const file of item.paths) if (!references.has(file)) files.add(file);
    // Never delete metadata by raw caller IDs before establishing attachment ownership.
    await tx.delete(wpPostmeta).where(inArray(wpPostmeta.postId, parsed));
    const removed = await tx.delete(wpPosts).where(and(inArray(wpPosts.id, parsed), eq(wpPosts.postType, "attachment"))).returning({ id: wpPosts.id });
    if (removed.length !== parsed.length) throw new MediaUploadError("admin.media.details_not_found");
    return removed.length;
  });
  // Commit the database first: failed DB writes must never remove physical files.
  if (files.size) {
    let root: string | undefined;
    try { root = await mediaRoot(); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") cleanupPending += files.size; }
    if (root) for (const relative of files) try { await fs.unlink(await checkedMediaPath(root, relative)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") cleanupPending++; }
  }
  if (cleanupPending) console.warn("Media file cleanup incomplete", { count: cleanupPending });
  return { deletedCount, ...(cleanupPending ? { cleanupPending } : {}) };
}
