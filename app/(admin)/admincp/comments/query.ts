import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { db } from "@/db";
import { postTranslationsTable, wpComments, wpPosts } from "@/db/schema";
import { and, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { SelectComment } from "@/db/schema/cms-comments";

export type CommentWithPost = SelectComment & {
    postTitle: string | null;
    postSlug: string | null;
};

export interface GetCommentsOptions {
    status?: string;
    search?: string;
    commentType?: string;
    language?: string;
    page?: number;
    limit?: number;
}

export async function getAllComments(options: GetCommentsOptions = {}) {
    await verifyAdminOrEditor();

    const { status, search, commentType, language, page = 1, limit = 20 } = options;
    const offset = Math.max(0, (page - 1) * limit);

    const conditions = [];

    if (status && status !== "all") {
        conditions.push(eq(wpComments.commentApproved, status));
    }

    if (commentType && commentType !== "all") {
        if (commentType === "comment") {
            conditions.push(or(eq(wpComments.commentType, ""), eq(wpComments.commentType, "comment")));
        } else if (commentType === "pings") {
            conditions.push(or(eq(wpComments.commentType, "pingback"), eq(wpComments.commentType, "trackback")));
        } else {
            conditions.push(eq(wpComments.commentType, commentType));
        }
    }

    if (language && language !== "all") {
        const langPostRows = await db
            .select({ postId: postTranslationsTable.postId })
            .from(postTranslationsTable)
            .where(eq(postTranslationsTable.languageCode, language));
        const postIds = langPostRows.map((r) => r.postId);
        if (postIds.length > 0) {
            conditions.push(inArray(wpComments.commentPostId, postIds));
        } else {
            conditions.push(eq(wpComments.commentId, BigInt(-1)));
        }
    }

    if (search && search.trim().length > 0) {
        const term = `%${search.trim()}%`;
        conditions.push(
            sql`(${wpComments.commentContent} ILIKE ${term} OR ${wpComments.commentAuthor} ILIKE ${term} OR ${wpComments.commentAuthorEmail} ILIKE ${term})`
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRes] = await Promise.all([
        db
            .select({
                comment: wpComments,
                postTitle: wpPosts.postTitle,
                postSlug: wpPosts.postName,
            })
            .from(wpComments)
            .leftJoin(wpPosts, eq(wpComments.commentPostId, wpPosts.id))
            .where(whereClause)
            .orderBy(desc(wpComments.commentDate))
            .limit(limit)
            .offset(offset),
        db
            .select({ total: count() })
            .from(wpComments)
            .where(whereClause),
    ]);

    const comments = rows.map((r) => ({
        ...r.comment,
        postTitle: r.postTitle ?? "Unknown / Deleted Post",
        postSlug: r.postSlug ?? "",
    }));

    return {
        comments,
        total: Number(countRes[0]?.total ?? 0),
    };
}

export async function getCommentById(id: bigint | string | number): Promise<CommentWithPost | null> {
    await verifyAdminOrEditor();
    const commentId = typeof id === "bigint" ? id : BigInt(id);

    const [row] = await db
        .select({
            comment: wpComments,
            postTitle: wpPosts.postTitle,
            postSlug: wpPosts.postName,
        })
        .from(wpComments)
        .leftJoin(wpPosts, eq(wpComments.commentPostId, wpPosts.id))
        .where(eq(wpComments.commentId, commentId))
        .limit(1);

    if (!row) return null;

    return {
        ...row.comment,
        postTitle: row.postTitle ?? "Unknown / Deleted Post",
        postSlug: row.postSlug ?? "",
    };
}

export async function getCommentCounts() {
    await verifyAdminOrEditor();

    const [allRes, approvedRes, pendingRes, spamRes, trashRes] = await Promise.all([
        db.select({ total: count() }).from(wpComments),
        db.select({ total: count() }).from(wpComments).where(eq(wpComments.commentApproved, "1")),
        db.select({ total: count() }).from(wpComments).where(eq(wpComments.commentApproved, "0")),
        db.select({ total: count() }).from(wpComments).where(eq(wpComments.commentApproved, "spam")),
        db.select({ total: count() }).from(wpComments).where(eq(wpComments.commentApproved, "trash")),
    ]);

    return {
        all: Number(allRes[0]?.total ?? 0),
        approved: Number(approvedRes[0]?.total ?? 0),
        pending: Number(pendingRes[0]?.total ?? 0),
        spam: Number(spamRes[0]?.total ?? 0),
        trash: Number(trashRes[0]?.total ?? 0),
    };
}

export async function getPostOptionsForComments() {
    await verifyAdminOrEditor();

    return db
        .select({
            id: wpPosts.id,
            title: wpPosts.postTitle,
        })
        .from(wpPosts)
        .where(eq(wpPosts.postType, "post"))
        .orderBy(desc(wpPosts.postDate))
        .limit(50);
}