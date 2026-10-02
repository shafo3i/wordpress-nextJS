import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { db } from "@/db";
import { wpPosts, wpPostmeta, wpOptions } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

export interface ImageSizeConfig {
  name: string;
  width: number;
  height: number;
  crop: boolean;
}

export const THEME_THUMBNAIL_SIZES: ImageSizeConfig[] = [
  { name: "thumbnail", width: 150, height: 150, crop: true },
  { name: "medium", width: 600, height: 400, crop: false },
  { name: "large", width: 1024, height: 768, crop: false },
  { name: "hero", width: 1200, height: 675, crop: true },
];

export interface MediaOverviewStats {
  attachmentCount: number;
  physicalFilesCount: number;
  totalDiskUsageBytes: number;
  uploadsDirWritable: boolean;
  configuredSizes: ImageSizeConfig[];
}

export interface OrphanFileItem {
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
  modifiedAt: string;
  previewUrl: string;
}

export interface OrphanScanResult {
  totalFiles: number;
  inUseCount: number;
  orphanCount: number;
  reclaimableBytes: number;
  orphanFiles: OrphanFileItem[];
}

function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads");
}

function getQuarantineDir(): string {
  return path.join(process.cwd(), "public", "uploads", ".quarantine");
}

/**
 * Recursively retrieves all physical files within a directory, ignoring hidden/quarantine folders.
 */
async function walkDirectory(dir: string): Promise<string[]> {
  const results: string[] = [];
  if (!fsSync.existsSync(dir)) return results;

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // skip .quarantine and hidden files
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkDirectory(fullPath);
      results.push(...nested);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Calculates current media attachment and disk storage stats
 */
export async function getMediaOverviewStats(): Promise<MediaOverviewStats> {
  const uploadsDir = getUploadsDir();

  // 1. Total attachments in DB
  const [attachmentRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(wpPosts)
    .where(
      and(
        eq(wpPosts.postType, "attachment"),
        sql`${wpPosts.postMimeType} LIKE 'image/%'`
      )
    );

  const attachmentCount = attachmentRows?.count || 0;

  // 2. Physical disk files
  let physicalFilesCount = 0;
  let totalDiskUsageBytes = 0;
  let uploadsDirWritable = false;

  try {
    if (!fsSync.existsSync(uploadsDir)) {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    // Test write permission
    const testFile = path.join(uploadsDir, `.test_write_${Date.now()}`);
    await fs.writeFile(testFile, "test");
    await fs.unlink(testFile);
    uploadsDirWritable = true;

    const allFiles = await walkDirectory(uploadsDir);
    physicalFilesCount = allFiles.length;

    for (const filePath of allFiles) {
      try {
        const stat = await fs.stat(filePath);
        totalDiskUsageBytes += stat.size;
      } catch {
        // ignore individual stat error
      }
    }
  } catch {
    uploadsDirWritable = false;
  }

  return {
    attachmentCount,
    physicalFilesCount,
    totalDiskUsageBytes,
    uploadsDirWritable,
    configuredSizes: THEME_THUMBNAIL_SIZES,
  };
}

/**
 * Seeds sample editorial photos into public/uploads and creates real DB attachment records
 * Useful for testing thumbnail regeneration and orphan cleaning on freshly initialized projects.
 */
export async function seedSampleMedia(): Promise<{ createdCount: number }> {
  const uploadsDir = getUploadsDir();
  const yearMonthDir = path.join(uploadsDir, "2026", "10");
  await fs.mkdir(yearMonthDir, { recursive: true });

  const sampleImages = [
    {
      filename: "editorial-financial-district.jpg",
      title: "Financial District High-Frequency Trade Corridors",
      color1: "#1e3a8a",
      color2: "#0284c7",
      width: 1920,
      height: 1080,
    },
    {
      filename: "editorial-tech-quantum.jpg",
      title: "Quantum Neural Processing Lab",
      color1: "#064e3b",
      color2: "#10b981",
      width: 1920,
      height: 1080,
    },
    {
      filename: "editorial-aerospace-policy.jpg",
      title: "Commercial Orbital Launch Logistics",
      color1: "#4c1d95",
      color2: "#8b5cf6",
      width: 1920,
      height: 1080,
    },
  ];

  let createdCount = 0;

  for (const img of sampleImages) {
    const filePath = path.join(yearMonthDir, img.filename);
    const relPath = `2026/10/${img.filename}`;

    // Create high-res SVG and rasterize to JPG using sharp
    const svg = `
      <svg width="${img.width}" height="${img.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${img.color1}" />
            <stop offset="100%" stop-color="${img.color2}" />
          </linearGradient>
        </defs>
        <rect width="${img.width}" height="${img.height}" fill="url(#g)" />
        <text x="100" y="540" font-family="sans-serif" font-size="72" font-weight="bold" fill="#ffffff" opacity="0.9">
          ${img.title}
        </text>
        <text x="100" y="620" font-family="sans-serif" font-size="36" fill="#cbd5e1" opacity="0.8">
          PressForge Newsroom Editorial Archive • 1920x1080
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(filePath);

    // Insert attachment row into wpPosts
    const [inserted] = await db
      .insert(wpPosts)
      .values({
        postTitle: img.title,
        postName: path.parse(img.filename).name,
        postType: "attachment",
        postMimeType: "image/jpeg",
        postStatus: "inherit",
        guid: `/uploads/${relPath}`,
        postDate: new Date(),
        postDateGmt: new Date(),
        postModified: new Date(),
        postModifiedGmt: new Date(),
      })
      .returning({ id: wpPosts.id });

    if (inserted?.id) {
      await db.insert(wpPostmeta).values([
        {
          postId: inserted.id,
          metaKey: "_wp_attached_file",
          metaValue: relPath,
        },
        {
          postId: inserted.id,
          metaKey: "_wp_attachment_metadata",
          metaValue: JSON.stringify({
            width: img.width,
            height: img.height,
            file: relPath,
            sizes: {},
          }),
        },
      ]);
      createdCount++;
    }
  }

  // Also create one genuine orphan file (not referenced anywhere in DB)
  const orphanFile = path.join(yearMonthDir, "abandoned-draft-diagram.png");
  const orphanSvg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="#334155" />
      <text x="80" y="300" font-family="sans-serif" font-size="36" fill="#f87171">
        Unreferenced Abandoned Media Draft
      </text>
    </svg>
  `;
  await sharp(Buffer.from(orphanSvg)).png().toFile(orphanFile);

  return { createdCount };
}

/**
 * Regenerates responsive thumbnails and modern WebP variants for all or selected image attachments
 */
export async function regenerateThumbnails(options: {
  generateWebp?: boolean;
  onlyMissing?: boolean;
  attachmentIds?: number[];
}): Promise<{
  processed: number;
  totalSizesGenerated: number;
  details: Array<{
    id: number;
    title: string;
    sizesCreated: string[];
    success: boolean;
    error?: string;
  }>;
}> {
  const uploadsDir = getUploadsDir();
  const generateWebp = options.generateWebp ?? true;
  const onlyMissing = options.onlyMissing ?? false;

  let query = db
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      guid: wpPosts.guid,
    })
    .from(wpPosts)
    .where(
      and(
        eq(wpPosts.postType, "attachment"),
        sql`${wpPosts.postMimeType} LIKE 'image/%'`
      )
    );

  if (options.attachmentIds && options.attachmentIds.length > 0) {
    query = db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        guid: wpPosts.guid,
      })
      .from(wpPosts)
      .where(
        and(
          eq(wpPosts.postType, "attachment"),
          inArray(wpPosts.id, options.attachmentIds.map((id) => BigInt(id)))
        )
      );
  }

  const attachments = await query;
  let totalSizesGenerated = 0;
  const details = [];

  for (const attachment of attachments) {
    const id = Number(attachment.id);
    try {
      // Find attached file path from postmeta
      const metaRows = await db
        .select({
          metaKey: wpPostmeta.metaKey,
          metaValue: wpPostmeta.metaValue,
        })
        .from(wpPostmeta)
        .where(
          and(
            eq(wpPostmeta.postId, BigInt(id)),
            sql`${wpPostmeta.metaKey} IN ('_wp_attached_file', '_wp_attachment_metadata')`
          )
        );

      let attachedFileRel: string | null = null;
      let existingMetadata: any = {};

      for (const row of metaRows) {
        if (row.metaKey === "_wp_attached_file") attachedFileRel = row.metaValue;
        if (row.metaKey === "_wp_attachment_metadata" && row.metaValue) {
          try {
            existingMetadata = JSON.parse(row.metaValue);
          } catch {
            existingMetadata = {};
          }
        }
      }

      if (!attachedFileRel && attachment.guid) {
        // Fallback: extract path from guid e.g. /uploads/2026/10/photo.jpg
        const match = attachment.guid.match(/\/uploads\/(.+)$/);
        if (match) attachedFileRel = match[1];
      }

      if (!attachedFileRel) {
        details.push({
          id,
          title: attachment.title || `Attachment #${id}`,
          sizesCreated: [],
          success: false,
          error: "No source file path found in metadata",
        });
        continue;
      }

      const sourceFullPath = path.join(uploadsDir, attachedFileRel);
      if (!fsSync.existsSync(sourceFullPath)) {
        details.push({
          id,
          title: attachment.title || `Attachment #${id}`,
          sizesCreated: [],
          success: false,
          error: `Source file missing on disk: ${attachedFileRel}`,
        });
        continue;
      }

      const sourceDir = path.dirname(sourceFullPath);
      const parsedPath = path.parse(sourceFullPath);
      const baseName = parsedPath.name;
      const ext = parsedPath.ext;

      const sourceBuffer = await fs.readFile(sourceFullPath);
      const imagePipeline = sharp(sourceBuffer);
      const originalMeta = await imagePipeline.metadata();

      const origWidth = originalMeta.width || 1200;
      const origHeight = originalMeta.height || 800;

      const updatedSizes: Record<string, any> = existingMetadata.sizes || {};
      const sizesCreated: string[] = [];

      for (const size of THEME_THUMBNAIL_SIZES) {
        const thumbFilename = `${baseName}-${size.width}x${size.height}${ext}`;
        const thumbFullPath = path.join(sourceDir, thumbFilename);

        // Skip if onlyMissing and file already exists
        if (onlyMissing && fsSync.existsSync(thumbFullPath)) {
          continue;
        }

        // Generate thumbnail format
        const thumbInstance = sharp(sourceBuffer);
        if (size.crop) {
          thumbInstance.resize({
            width: size.width,
            height: size.height,
            fit: "cover",
            position: "center",
          });
        } else {
          thumbInstance.resize({
            width: size.width,
            height: size.height,
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        await thumbInstance.toFile(thumbFullPath);
        sizesCreated.push(`${size.name} (${size.width}x${size.height})`);
        totalSizesGenerated++;

        updatedSizes[size.name] = {
          file: thumbFilename,
          width: size.width,
          height: size.height,
          mimeType: originalMeta.format ? `image/${originalMeta.format}` : "image/jpeg",
        };

        // Generate WebP variant if requested
        if (generateWebp) {
          const webpFilename = `${baseName}-${size.width}x${size.height}.webp`;
          const webpFullPath = path.join(sourceDir, webpFilename);
          await sharp(sourceBuffer)
            .resize({
              width: size.width,
              height: size.height,
              fit: size.crop ? "cover" : "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 82 })
            .toFile(webpFullPath);

          sizesCreated.push(`${size.name} [WebP]`);
          totalSizesGenerated++;
        }
      }

      // Update _wp_attachment_metadata in wp_postmeta
      const newMetadata = {
        width: origWidth,
        height: origHeight,
        file: attachedFileRel,
        sizes: updatedSizes,
        image_meta: {
          created_timestamp: Date.now(),
        },
      };

      const existingMetaRow = await db
        .select({ metaId: wpPostmeta.metaId })
        .from(wpPostmeta)
        .where(
          and(
            eq(wpPostmeta.postId, BigInt(id)),
            eq(wpPostmeta.metaKey, "_wp_attachment_metadata")
          )
        )
        .limit(1);

      if (existingMetaRow.length > 0) {
        await db
          .update(wpPostmeta)
          .set({ metaValue: JSON.stringify(newMetadata) })
          .where(eq(wpPostmeta.metaId, existingMetaRow[0].metaId));
      } else {
        await db.insert(wpPostmeta).values({
          postId: BigInt(id),
          metaKey: "_wp_attachment_metadata",
          metaValue: JSON.stringify(newMetadata),
        });
      }

      details.push({
        id,
        title: attachment.title || `Attachment #${id}`,
        sizesCreated,
        success: true,
      });
    } catch (err: any) {
      details.push({
        id,
        title: attachment.title || `Attachment #${id}`,
        sizesCreated: [],
        success: false,
        error: err?.message || "Unknown error during thumbnail generation",
      });
    }
  }

  return {
    processed: attachments.length,
    totalSizesGenerated,
    details,
  };
}

/**
 * Scans public/uploads for orphaned files not referenced anywhere in the database
 */
export async function scanOrphanMedia(): Promise<OrphanScanResult> {
  const uploadsDir = getUploadsDir();
  const allFiles = await walkDirectory(uploadsDir);

  if (allFiles.length === 0) {
    return {
      totalFiles: 0,
      inUseCount: 0,
      orphanCount: 0,
      reclaimableBytes: 0,
      orphanFiles: [],
    };
  }

  // 1. Gather all attached files & metadata sizes from wp_postmeta
  const metaRows = await db
    .select({
      metaKey: wpPostmeta.metaKey,
      metaValue: wpPostmeta.metaValue,
    })
    .from(wpPostmeta)
    .where(
      sql`${wpPostmeta.metaKey} IN ('_wp_attached_file', '_wp_attachment_metadata')`
    );

  const referencedBaseFiles = new Set<string>();

  for (const row of metaRows) {
    if (row.metaKey === "_wp_attached_file" && row.metaValue) {
      referencedBaseFiles.add(path.normalize(row.metaValue.trim()));
      referencedBaseFiles.add(path.basename(row.metaValue.trim()));
    }
    if (row.metaKey === "_wp_attachment_metadata" && row.metaValue) {
      try {
        const parsed = JSON.parse(row.metaValue);
        if (parsed.file) {
          referencedBaseFiles.add(path.normalize(parsed.file));
          referencedBaseFiles.add(path.basename(parsed.file));
        }
        if (parsed.sizes && typeof parsed.sizes === "object") {
          for (const sizeKey of Object.keys(parsed.sizes)) {
            const sizeObj = parsed.sizes[sizeKey];
            if (sizeObj?.file) {
              referencedBaseFiles.add(path.normalize(sizeObj.file));
              referencedBaseFiles.add(path.basename(sizeObj.file));
            }
          }
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  // 2. Gather image references in posts (post_content, guid)
  const postsWithImages = await db
    .select({
      content: wpPosts.postContent,
      guid: wpPosts.guid,
    })
    .from(wpPosts)
    .where(sql`${wpPosts.postContent} LIKE '%uploads/%' OR ${wpPosts.guid} LIKE '%uploads/%'`);

  for (const post of postsWithImages) {
    if (post.guid) {
      const match = post.guid.match(/\/uploads\/(.+)$/);
      if (match) {
        referencedBaseFiles.add(path.normalize(match[1]));
        referencedBaseFiles.add(path.basename(match[1]));
      }
    }
    if (post.content) {
      const matches = post.content.match(/\/uploads\/[a-zA-Z0-9_\-\.\/]+/g);
      if (matches) {
        for (const m of matches) {
          const clean = m.replace("/uploads/", "");
          referencedBaseFiles.add(path.normalize(clean));
          referencedBaseFiles.add(path.basename(clean));
        }
      }
    }
  }

  // 3. Compare physical files with DB references
  const orphanFiles: OrphanFileItem[] = [];
  let reclaimableBytes = 0;
  let inUseCount = 0;

  for (const fullPath of allFiles) {
    const relFromUploads = path.relative(uploadsDir, fullPath).replace(/\\/g, "/");
    const filename = path.basename(fullPath);

    // Check if filename or relative path is in referenced set
    // Also handle webp variants of referenced files
    const baseWithoutWebp = filename.endsWith(".webp")
      ? filename.replace(/\.webp$/, "")
      : null;

    let isReferenced =
      referencedBaseFiles.has(relFromUploads) ||
      referencedBaseFiles.has(filename);

    if (!isReferenced && baseWithoutWebp) {
      // If webp version of a referenced image thumbnail
      for (const ref of referencedBaseFiles) {
        if (ref.includes(baseWithoutWebp)) {
          isReferenced = true;
          break;
        }
      }
    }

    if (isReferenced) {
      inUseCount++;
    } else {
      try {
        const stat = await fs.stat(fullPath);
        reclaimableBytes += stat.size;
        orphanFiles.push({
          relativePath: relFromUploads,
          absolutePath: fullPath,
          sizeBytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          previewUrl: `/uploads/${relFromUploads}`,
        });
      } catch {
        // ignore stat errors
      }
    }
  }

  return {
    totalFiles: allFiles.length,
    inUseCount,
    orphanCount: orphanFiles.length,
    reclaimableBytes,
    orphanFiles,
  };
}

/**
 * Quarantines or permanently deletes selected orphaned files
 */
export async function cleanOrphanMedia(
  filePaths: string[],
  action: "quarantine" | "delete"
): Promise<{
  cleanedCount: number;
  reclaimedBytes: number;
  actionTaken: "quarantine" | "delete";
}> {
  const uploadsDir = getUploadsDir();
  const quarantineDir = getQuarantineDir();

  let cleanedCount = 0;
  let reclaimedBytes = 0;

  for (const relPath of filePaths) {
    // Sanitize path to prevent directory traversal
    const safeRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(uploadsDir, safeRel);

    // Security check: path must stay inside uploadsDir
    if (!fullPath.startsWith(uploadsDir)) continue;
    if (!fsSync.existsSync(fullPath)) continue;

    try {
      const stat = await fs.stat(fullPath);
      const fileSize = stat.size;

      if (action === "quarantine") {
        const targetPath = path.join(quarantineDir, safeRel);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.rename(fullPath, targetPath);
      } else {
        await fs.unlink(fullPath);
      }

      cleanedCount++;
      reclaimedBytes += fileSize;
    } catch (err) {
      console.error(`Error cleaning file ${safeRel}:`, err);
    }
  }

  return {
    cleanedCount,
    reclaimedBytes,
    actionTaken: action,
  };
}
