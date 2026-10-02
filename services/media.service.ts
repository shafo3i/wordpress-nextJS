import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { db } from "@/db";
import { wpPosts, wpPostmeta, user } from "@/db/schema";
import { eq, and, desc, sql, like, inArray } from "drizzle-orm";
import { THEME_THUMBNAIL_SIZES } from "./media-tools.service";

export interface MediaItem {
  id: number;
  title: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  altText: string;
  caption: string;
  description: string;
  uploadedAt: string;
  authorName: string;
  postParent?: number;
}

export interface MediaListResult {
  items: MediaItem[];
  total: number;
  totalPages: number;
  currentPage: number;
  availableMonths: Array<{ value: string; label: string }>;
}

function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads");
}

function sanitizeFilename(originalName: string): string {
  const parsed = path.parse(originalName);
  const cleanBase = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const ext = parsed.ext.toLowerCase();
  return `${cleanBase || "file"}${ext}`;
}

/**
 * Queries paginated media attachments with type, date, and search filters
 */
export async function getMediaLibraryItems(params: {
  type?: string;
  month?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<MediaListResult> {
  const page = Math.max(1, params.page || 1);
  const perPage = Math.min(100, Math.max(1, params.perPage || 40));
  const offset = (page - 1) * perPage;

  const conditions = [eq(wpPosts.postType, "attachment")];

  // Type filter
  if (params.type && params.type !== "all") {
    if (params.type === "image") {
      conditions.push(sql`${wpPosts.postMimeType} LIKE 'image/%'`);
    } else if (params.type === "document") {
      conditions.push(
        sql`(${wpPosts.postMimeType} LIKE 'application/%' OR ${wpPosts.postMimeType} LIKE 'text/%')`
      );
    } else if (params.type === "audio") {
      conditions.push(sql`${wpPosts.postMimeType} LIKE 'audio/%'`);
    } else if (params.type === "video") {
      conditions.push(sql`${wpPosts.postMimeType} LIKE 'video/%'`);
    }
  }

  // Month filter (format: "YYYY-MM")
  if (params.month && params.month !== "all") {
    const [year, month] = params.month.split("-");
    if (year && month) {
      conditions.push(
        sql`TO_CHAR(${wpPosts.postDate}, 'YYYY-MM') = ${params.month}`
      );
    }
  }

  // Search filter
  if (params.search && params.search.trim()) {
    const s = `%${params.search.trim()}%`;
    conditions.push(
      sql`(${wpPosts.postTitle} ILIKE ${s} OR ${wpPosts.guid} ILIKE ${s})`
    );
  }

  // Get total count
  const [totalCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(wpPosts)
    .where(and(...conditions));

  const total = totalCountRow?.count || 0;
  const totalPages = Math.ceil(total / perPage);

  // Fetch paginated rows
  const rows = await db
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      caption: wpPosts.postExcerpt,
      description: wpPosts.postContent,
      mimeType: wpPosts.postMimeType,
      guid: wpPosts.guid,
      postDate: wpPosts.postDate,
      postParent: wpPosts.postParent,
      authorId: wpPosts.postAuthor,
    })
    .from(wpPosts)
    .where(and(...conditions))
    .orderBy(desc(wpPosts.postDate))
    .limit(perPage)
    .offset(offset);

  const postIds = rows.map((r) => r.id);
  const metaMap = new Map<string, Record<string, string>>();

  if (postIds.length > 0) {
    const metas = await db
      .select({
        postId: wpPostmeta.postId,
        metaKey: wpPostmeta.metaKey,
        metaValue: wpPostmeta.metaValue,
      })
      .from(wpPostmeta)
      .where(
        and(
          inArray(wpPostmeta.postId, postIds),
          sql`${wpPostmeta.metaKey} IN ('_wp_attached_file', '_wp_attachment_metadata', '_wp_attachment_image_alt')`
        )
      );

    for (const m of metas) {
      const key = m.postId.toString();
      if (!metaMap.has(key)) metaMap.set(key, {});
      if (m.metaKey && m.metaValue) {
        metaMap.get(key)![m.metaKey] = m.metaValue;
      }
    }
  }

  // Also query author names if available
  const authorIds = Array.from(new Set(rows.map((r) => r.authorId).filter(Boolean)));
  const authorMap = new Map<string, string>();
  if (authorIds.length > 0) {
    try {
      const users = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, authorIds.map(String)));
      for (const u of users) {
        authorMap.set(u.id, u.name);
      }
    } catch {
      // fallback
    }
  }

  const items: MediaItem[] = rows.map((row) => {
    const id = Number(row.id);
    const postMetas = metaMap.get(id.toString()) || {};
    const attachedFile = postMetas["_wp_attached_file"] || "";
    const altText = postMetas["_wp_attachment_image_alt"] || "";

    let width: number | undefined;
    let height: number | undefined;
    let thumbnailUrl = row.guid || "";

    if (postMetas["_wp_attachment_metadata"]) {
      try {
        const parsed = JSON.parse(postMetas["_wp_attachment_metadata"]);
        width = parsed.width;
        height = parsed.height;
        if (parsed.sizes?.thumbnail?.file) {
          const baseDir = path.dirname(attachedFile).replace(/\\/g, "/");
          thumbnailUrl = `/uploads/${baseDir}/${parsed.sizes.thumbnail.file}`;
        }
      } catch {
        // ignore
      }
    }

    const filename = attachedFile ? path.basename(attachedFile) : path.basename(row.guid || "file");

    return {
      id,
      title: row.title || filename,
      filename,
      url: row.guid || `/uploads/${attachedFile}`,
      thumbnailUrl: thumbnailUrl || row.guid || "",
      mimeType: row.mimeType || "image/jpeg",
      sizeBytes: 0,
      width,
      height,
      altText,
      caption: row.caption || "",
      description: row.description || "",
      uploadedAt: (row.postDate || new Date()).toISOString(),
      authorName: authorMap.get(String(row.authorId)) || "Admin",
      postParent: row.postParent ? Number(row.postParent) : undefined,
    };
  });

  // Calculate available distinct months for the dropdown
  const monthRows = await db
    .select({
      monthStr: sql<string>`TO_CHAR(${wpPosts.postDate}, 'YYYY-MM')`,
    })
    .from(wpPosts)
    .where(eq(wpPosts.postType, "attachment"))
    .groupBy(sql`TO_CHAR(${wpPosts.postDate}, 'YYYY-MM')`)
    .orderBy(desc(sql`TO_CHAR(${wpPosts.postDate}, 'YYYY-MM')`));

  const availableMonths = monthRows
    .filter((m) => Boolean(m.monthStr))
    .map((m) => {
      const [year, month] = m.monthStr.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      return { value: m.monthStr, label };
    });

  return {
    items,
    total,
    totalPages,
    currentPage: page,
    availableMonths,
  };
}

/**
 * Handles single or multiple file uploads, image resizing via Sharp, and database registration
 */
export async function uploadMediaFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  authorId?: string
): Promise<MediaItem> {
  const uploadsDir = getUploadsDir();

  // Create date-based folder: public/uploads/YYYY/MM
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const relDir = `${year}/${month}`;
  const targetDir = path.join(uploadsDir, year, month);

  if (!fsSync.existsSync(targetDir)) {
    await fs.mkdir(targetDir, { recursive: true });
  }

  // Ensure unique filename
  const cleanName = sanitizeFilename(originalFilename);
  const parsed = path.parse(cleanName);
  let finalFilename = cleanName;
  let counter = 1;

  while (fsSync.existsSync(path.join(targetDir, finalFilename))) {
    finalFilename = `${parsed.name}-${counter}${parsed.ext}`;
    counter++;
  }

  const finalFullPath = path.join(targetDir, finalFilename);
  const relFilePath = `${relDir}/${finalFilename}`.replace(/\\/g, "/");
  const fileUrl = `/uploads/${relFilePath}`;

  // Write original file to disk
  await fs.writeFile(finalFullPath, fileBuffer);

  let width = 0;
  let height = 0;
  const sizesMetadata: Record<string, any> = {};
  const isImage = mimeType.startsWith("image/");

  if (isImage) {
    try {
      const imagePipeline = sharp(fileBuffer);
      const meta = await imagePipeline.metadata();
      width = meta.width || 0;
      height = meta.height || 0;

      // Generate responsive sizes & WebP variants
      for (const size of THEME_THUMBNAIL_SIZES) {
        const thumbName = `${parsed.name}-${size.width}x${size.height}${parsed.ext}`;
        const thumbPath = path.join(targetDir, thumbName);

        const thumb = sharp(fileBuffer);
        if (size.crop) {
          thumb.resize({
            width: size.width,
            height: size.height,
            fit: "cover",
            position: "center",
          });
        } else {
          thumb.resize({
            width: size.width,
            height: size.height,
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        await thumb.toFile(thumbPath);

        sizesMetadata[size.name] = {
          file: thumbName,
          width: size.width,
          height: size.height,
          mimeType: meta.format ? `image/${meta.format}` : mimeType,
        };

        // Also generate WebP variant
        const webpName = `${parsed.name}-${size.width}x${size.height}.webp`;
        const webpPath = path.join(targetDir, webpName);
        await sharp(fileBuffer)
          .resize({
            width: size.width,
            height: size.height,
            fit: size.crop ? "cover" : "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toFile(webpPath);
      }
    } catch (err) {
      console.error("Error generating thumbnails for uploaded image:", err);
    }
  }

  // Resolve valid post author ID matching foreign key to user table
  let validAuthorId = authorId;
  if (!validAuthorId) {
    const defaultUser = await db.select({ id: user.id }).from(user).limit(1);
    validAuthorId = defaultUser[0]?.id || "aDjV7Yapfqfz3JFOtn2zbLrzMcZ9w8ix";
  }

  // Insert attachment into wpPosts
  const [inserted] = await db
    .insert(wpPosts)
    .values({
      postTitle: parsed.name.replace(/[-_]/g, " "),
      postName: parsed.name,
      postType: "attachment",
      postMimeType: mimeType,
      postStatus: "inherit",
      guid: fileUrl,
      postDate: now,
      postDateGmt: now,
      postModified: now,
      postModifiedGmt: now,
      postAuthor: validAuthorId,
    })
    .returning({ id: wpPosts.id });

  const id = Number(inserted.id);

  // Insert metadata records into wpPostmeta
  await db.insert(wpPostmeta).values([
    {
      postId: BigInt(id),
      metaKey: "_wp_attached_file",
      metaValue: relFilePath,
    },
    {
      postId: BigInt(id),
      metaKey: "_wp_attachment_metadata",
      metaValue: JSON.stringify({
        width,
        height,
        file: relFilePath,
        sizes: sizesMetadata,
        image_meta: {
          created_timestamp: Date.now(),
        },
      }),
    },
    {
      postId: BigInt(id),
      metaKey: "_wp_attachment_image_alt",
      metaValue: "",
    },
  ]);

  const thumbUrl = sizesMetadata.thumbnail?.file
    ? `/uploads/${relDir}/${sizesMetadata.thumbnail.file}`
    : fileUrl;

  return {
    id,
    title: parsed.name.replace(/[-_]/g, " "),
    filename: finalFilename,
    url: fileUrl,
    thumbnailUrl: thumbUrl,
    mimeType,
    sizeBytes: fileBuffer.length,
    width: width || undefined,
    height: height || undefined,
    altText: "",
    caption: "",
    description: "",
    uploadedAt: now.toISOString(),
    authorName: "Admin",
  };
}

/**
 * Updates metadata for a media item (Alt text, Title, Caption, Description)
 */
export async function updateMediaItem(
  id: number,
  data: {
    title?: string;
    altText?: string;
    caption?: string;
    description?: string;
  }
) {
  // 1. Update post fields in wpPosts
  const updateValues: Record<string, any> = {};
  if (data.title !== undefined) updateValues.postTitle = data.title;
  if (data.caption !== undefined) updateValues.postExcerpt = data.caption;
  if (data.description !== undefined) updateValues.postContent = data.description;

  if (Object.keys(updateValues).length > 0) {
    updateValues.postModified = new Date();
    updateValues.postModifiedGmt = new Date();
    await db
      .update(wpPosts)
      .set(updateValues)
      .where(and(eq(wpPosts.id, BigInt(id)), eq(wpPosts.postType, "attachment")));
  }

  // 2. Update alt text in wpPostmeta
  if (data.altText !== undefined) {
    const existing = await db
      .select({ metaId: wpPostmeta.metaId })
      .from(wpPostmeta)
      .where(
        and(
          eq(wpPostmeta.postId, BigInt(id)),
          eq(wpPostmeta.metaKey, "_wp_attachment_image_alt")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(wpPostmeta)
        .set({ metaValue: data.altText })
        .where(eq(wpPostmeta.metaId, existing[0].metaId));
    } else {
      await db.insert(wpPostmeta).values({
        postId: BigInt(id),
        metaKey: "_wp_attachment_image_alt",
        metaValue: data.altText,
      });
    }
  }

  return { success: true };
}

/**
 * Permanently deletes media attachments from database and removes all physical files and thumbnails from disk
 */
export async function deleteMediaItems(ids: number[]): Promise<{ deletedCount: number }> {
  if (ids.length === 0) return { deletedCount: 0 };
  const uploadsDir = getUploadsDir();

  // 1. Retrieve all file paths and metadata before deleting from DB
  const metaRows = await db
    .select({
      postId: wpPostmeta.postId,
      metaKey: wpPostmeta.metaKey,
      metaValue: wpPostmeta.metaValue,
    })
    .from(wpPostmeta)
    .where(
      and(
        inArray(wpPostmeta.postId, ids.map((id) => BigInt(id))),
        sql`${wpPostmeta.metaKey} IN ('_wp_attached_file', '_wp_attachment_metadata')`
      )
    );

  const filesToDelete = new Set<string>();

  for (const row of metaRows) {
    if (row.metaKey === "_wp_attached_file" && row.metaValue) {
      const origRel = row.metaValue;
      filesToDelete.add(path.join(uploadsDir, origRel));
      const origDir = path.dirname(origRel);

      // Check metadata for thumbnails
      const metaObj = metaRows.find(
        (m) => m.postId === row.postId && m.metaKey === "_wp_attachment_metadata"
      );
      if (metaObj?.metaValue) {
        try {
          const parsed = JSON.parse(metaObj.metaValue);
          if (parsed.sizes && typeof parsed.sizes === "object") {
            for (const sizeKey of Object.keys(parsed.sizes)) {
              const s = parsed.sizes[sizeKey];
              if (s?.file) {
                filesToDelete.add(path.join(uploadsDir, origDir, s.file));
                // Also check for corresponding webp
                const webpFile = s.file.replace(/\.[^.]+$/, ".webp");
                filesToDelete.add(path.join(uploadsDir, origDir, webpFile));
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // 2. Delete physical files from disk
  for (const filePath of filesToDelete) {
    try {
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete media file: ${filePath}`, err);
    }
  }

  // 3. Delete postmeta and posts records
  await db
    .delete(wpPostmeta)
    .where(inArray(wpPostmeta.postId, ids.map((id) => BigInt(id))));

  await db
    .delete(wpPosts)
    .where(
      and(
        inArray(wpPosts.id, ids.map((id) => BigInt(id))),
        eq(wpPosts.postType, "attachment")
      )
    );

  return { deletedCount: ids.length };
}
