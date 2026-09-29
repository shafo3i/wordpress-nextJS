import { eq, desc, asc, and, count, sql } from "drizzle-orm";
import { DB, db } from "@/db";
import {
    wpComments,
    wpCommentmeta,
    createCommentSchema,
    InsertComment,
    InsertCommentOutput,
    SelectComment,
    createCommentMetaSchema,
    InsertCommentMeta,
    SelectCommentMeta,
} from "@/db/schema/cms-comments";
import { wpPosts } from "@/db/schema/cms-posts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBigInt(val: bigint | string | number): bigint {
    return typeof val === "bigint" ? val : BigInt(val);
}

/**
 * Synchronizes the comment_count on wp_posts for a given post ID.
 * Counts only approved comments ('1').
 */
export async function syncPostCommentCount(
    postId: bigint | string | number,
    database: DB = db
): Promise<bigint> {
    const pId = toBigInt(postId);

    const [result] = await database
        .select({ total: count() })
        .from(wpComments)
        .where(
            and(
                eq(wpComments.commentPostId, pId),
                eq(wpComments.commentApproved, "1")
            )
        );

    const total = result?.total ? BigInt(result.total) : BigInt(0);

    await database
        .update(wpPosts)
        .set({ commentCount: total })
        .where(eq(wpPosts.id, pId));

    return total;
}

// ---------------------------------------------------------------------------
// Types & Options
// ---------------------------------------------------------------------------

export interface GetPostCommentsOptions {
    approvedOnly?: boolean;
    limit?: number;
    offset?: number;
    order?: "asc" | "desc";
}

export interface ThreadedComment extends SelectComment {
    replies: ThreadedComment[];
}

export interface ListCommentsOptions {
    postId?: bigint | string | number;
    approved?: string;
    search?: string;
    userId?: string;
    limit?: number;
    offset?: number;
    order?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// CRUD operations for comments
// ---------------------------------------------------------------------------

/**
 * Creates a new comment, validates input, and updates post comment_count if approved.
 */
export async function createComment(
    data: InsertComment,
    database: DB = db
): Promise<SelectComment> {
    const validated = createCommentSchema.parse(data);

    const [inserted] = await database
        .insert(wpComments)
        .values(validated)
        .returning();

    if (inserted && inserted.commentPostId && inserted.commentApproved === "1") {
        await syncPostCommentCount(inserted.commentPostId, database);
    }

    return inserted;
}

/**
 * Retrieves a single comment by ID.
 */
export async function getCommentById(
    id: bigint | string | number,
    database: DB = db
): Promise<SelectComment | null> {
    const commentId = toBigInt(id);

    const [comment] = await database
        .select()
        .from(wpComments)
        .where(eq(wpComments.commentId, commentId))
        .limit(1);

    return comment ?? null;
}

/**
 * Retrieves flat list of comments for a given post.
 */
export async function getCommentsByPostId(
    postId: bigint | string | number,
    options: GetPostCommentsOptions = {},
    database: DB = db
): Promise<SelectComment[]> {
    const pId = toBigInt(postId);
    const { approvedOnly = true, limit = 100, offset = 0, order = "asc" } = options;

    const conditions = [eq(wpComments.commentPostId, pId)];
    if (approvedOnly) {
        conditions.push(eq(wpComments.commentApproved, "1"));
    }

    const orderBy = order === "asc" ? asc(wpComments.commentDate) : desc(wpComments.commentDate);

    return database
        .select()
        .from(wpComments)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);
}

/**
 * Retrieves comments organized hierarchically into a nested reply tree.
 */
export async function getThreadedCommentsByPostId(
    postId: bigint | string | number,
    options: Omit<GetPostCommentsOptions, "limit" | "offset"> = {},
    database: DB = db
): Promise<ThreadedComment[]> {
    const comments = await getCommentsByPostId(
        postId,
        { ...options, limit: 1000 },
        database
    );

    const commentMap = new Map<string, ThreadedComment>();
    const roots: ThreadedComment[] = [];

    for (const c of comments) {
        commentMap.set(c.commentId.toString(), { ...c, replies: [] });
    }

    for (const c of comments) {
        const node = commentMap.get(c.commentId.toString())!;
        const parentIdStr = c.commentParent.toString();

        if (c.commentParent === BigInt(0) || !commentMap.has(parentIdStr)) {
            roots.push(node);
        } else {
            commentMap.get(parentIdStr)!.replies.push(node);
        }
    }

    return roots;
}

/**
 * Lists comments with filtering, search, and pagination for AdminCP moderation.
 */
export async function listComments(
    options: ListCommentsOptions = {},
    database: DB = db
): Promise<{ comments: SelectComment[]; total: number }> {
    const {
        postId,
        approved,
        search,
        userId,
        limit = 20,
        offset = 0,
        order = "desc",
    } = options;

    const conditions = [];

    if (postId !== undefined) {
        conditions.push(eq(wpComments.commentPostId, toBigInt(postId)));
    }

    if (approved !== undefined) {
        conditions.push(eq(wpComments.commentApproved, approved));
    }

    if (userId !== undefined) {
        conditions.push(eq(wpComments.userId, userId));
    }

    if (search && search.trim().length > 0) {
        const term = `%${search.trim()}%`;
        conditions.push(
            sql`(${wpComments.commentContent} ILIKE ${term} OR ${wpComments.commentAuthor} ILIKE ${term} OR ${wpComments.commentAuthorEmail} ILIKE ${term})`
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const orderCol = order === "asc" ? asc(wpComments.commentDate) : desc(wpComments.commentDate);

    const [comments, countResult] = await Promise.all([
        database
            .select()
            .from(wpComments)
            .where(whereClause)
            .orderBy(orderCol)
            .limit(limit)
            .offset(offset),
        database
            .select({ total: count() })
            .from(wpComments)
            .where(whereClause),
    ]);

    return {
        comments,
        total: countResult[0]?.total ? Number(countResult[0].total) : 0,
    };
}

/**
 * Updates an existing comment by ID.
 * Synchronizes post comment_count if approval status changes.
 */
export async function updateComment(
    id: bigint | string | number,
    data: Partial<InsertCommentOutput>,
    database: DB = db
): Promise<SelectComment | null> {
    const commentId = toBigInt(id);

    const existing = await getCommentById(commentId, database);
    if (!existing) return null;

    const [updated] = await database
        .update(wpComments)
        .set(data)
        .where(eq(wpComments.commentId, commentId))
        .returning();

    if (
        updated &&
        updated.commentPostId &&
        (data.commentApproved !== undefined || existing.commentApproved !== updated.commentApproved)
    ) {
        await syncPostCommentCount(updated.commentPostId, database);
    }

    return updated ?? null;
}

/**
 * Updates comment approval status ('1', '0', 'spam', 'trash', 'pending').
 */
export async function updateCommentStatus(
    id: bigint | string | number,
    status: "1" | "0" | "spam" | "trash" | "pending",
    database: DB = db
): Promise<SelectComment | null> {
    return updateComment(id, { commentApproved: status }, database);
}

/**
 * Deletes a comment and its metadata, then updates the post comment_count.
 */
export async function deleteComment(
    id: bigint | string | number,
    database: DB = db
): Promise<boolean> {
    const commentId = toBigInt(id);

    const existing = await getCommentById(commentId, database);
    if (!existing) return false;

    const [deleted] = await database
        .delete(wpComments)
        .where(eq(wpComments.commentId, commentId))
        .returning();

    if (deleted && deleted.commentPostId) {
        await syncPostCommentCount(deleted.commentPostId, database);
    }

    return !!deleted;
}

// ---------------------------------------------------------------------------
// Comment Meta Operations
// ---------------------------------------------------------------------------

/**
 * Adds metadata to a comment.
 */
export async function addCommentMeta(
    data: InsertCommentMeta,
    database: DB = db
): Promise<SelectCommentMeta> {
    const validated = createCommentMetaSchema.parse(data);

    const [meta] = await database
        .insert(wpCommentmeta)
        .values(validated)
        .returning();

    return meta;
}

/**
 * Retrieves metadata for a comment, optionally filtered by metaKey.
 */
export async function getCommentMeta(
    commentId: bigint | string | number,
    metaKey?: string,
    database: DB = db
): Promise<SelectCommentMeta[]> {
    const cId = toBigInt(commentId);

    const conditions = [eq(wpCommentmeta.commentId, cId)];
    if (metaKey) {
        conditions.push(eq(wpCommentmeta.metaKey, metaKey));
    }

    return database
        .select()
        .from(wpCommentmeta)
        .where(and(...conditions));
}

/**
 * Updates or creates (upserts) comment metadata.
 */
export async function updateCommentMeta(
    commentId: bigint | string | number,
    metaKey: string,
    metaValue: string,
    database: DB = db
): Promise<SelectCommentMeta> {
    const cId = toBigInt(commentId);

    const [existing] = await database
        .select()
        .from(wpCommentmeta)
        .where(
            and(
                eq(wpCommentmeta.commentId, cId),
                eq(wpCommentmeta.metaKey, metaKey)
            )
        )
        .limit(1);

    if (existing) {
        const [updated] = await database
            .update(wpCommentmeta)
            .set({ metaValue })
            .where(eq(wpCommentmeta.metaId, existing.metaId))
            .returning();
        return updated;
    }

    return addCommentMeta(
        {
            commentId: cId,
            metaKey,
            metaValue,
        },
        database
    );
}

/**
 * Deletes metadata for a comment.
 */
export async function deleteCommentMeta(
    commentId: bigint | string | number,
    metaKey?: string,
    database: DB = db
): Promise<boolean> {
    const cId = toBigInt(commentId);

    const conditions = [eq(wpCommentmeta.commentId, cId)];
    if (metaKey) {
        conditions.push(eq(wpCommentmeta.metaKey, metaKey));
    }

    const deleted = await database
        .delete(wpCommentmeta)
        .where(and(...conditions))
        .returning();

    return deleted.length > 0;
}

// ---------------------------------------------------------------------------
// Service Export Object
// ---------------------------------------------------------------------------

export const commentService = {
    create: createComment,
    getById: getCommentById,
    getByPostId: getCommentsByPostId,
    getThreadedByPostId: getThreadedCommentsByPostId,
    list: listComments,
    update: updateComment,
    updateStatus: updateCommentStatus,
    delete: deleteComment,
    syncPostCommentCount,
    addMeta: addCommentMeta,
    getMeta: getCommentMeta,
    updateMeta: updateCommentMeta,
    deleteMeta: deleteCommentMeta,
};
