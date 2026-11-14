import "server-only";
import { verifyPostEditor } from "@/lib/authMIddleware";
import { mediaListQuerySchema } from "@/db/schema/cms-media-details";
import { mapMediaAttachment } from "@/lib/media-attachment";
import { updateMediaDetails } from "./media-details.service";
import { db, type DB } from "@/db";
import { wpPosts, wpPostmeta, user } from "@/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

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
  imageMetadata?: Record<string,unknown>;
}

export interface MediaListResult {
  items: MediaItem[];
  total: number;
  totalPages: number;
  currentPage: number;
  availableMonths: Array<{ value: string; label: string }>;
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
}, database: DB = db): Promise<MediaListResult> {
  await verifyPostEditor();
  const parsed = mediaListQuerySchema.parse(params);
  params = parsed;
  const { page, perPage } = parsed;
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
  const [totalCountRow] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(wpPosts)
    .where(and(...conditions));

  const total = totalCountRow?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Fetch paginated rows
  const rows = await database
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
    .orderBy(desc(wpPosts.postDate), desc(wpPosts.id))
    .limit(perPage)
    .offset(offset);

  const postIds = rows.map((r) => r.id);
  const metaMap = new Map<string, Record<string, string>>();

  if (postIds.length > 0) {
    const metas = await database
      .select({
        postId: wpPostmeta.postId,
        metaKey: wpPostmeta.metaKey,
        metaValue: sql<string>`left(${wpPostmeta.metaValue}, 100001)`,
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
      if (m.metaKey && m.metaValue && m.metaValue.length <= 100000) {
        metaMap.get(key)![m.metaKey] = m.metaValue;
      }
    }
  }

  // Also query author names if available
  const authorIds = Array.from(new Set(rows.map((r) => r.authorId).filter(Boolean)));
  const authorMap = new Map<string, string>();
  if (authorIds.length > 0) {
    try {
      const users = await database
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

  const items: MediaItem[] = rows.map(row => mapMediaAttachment({...row,authorName:authorMap.get(String(row.authorId))},metaMap.get(row.id.toString())||{}));

  // Calculate available distinct months for the dropdown
  const monthRows = await database
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
      const label = m.monthStr;
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

export { uploadMediaFile } from "./media-upload.service";

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
  await updateMediaDetails(id,data);
  return {success:true};
}

export { deleteMediaItems } from "./media-delete.service";
