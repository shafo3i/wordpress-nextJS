import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
import { eq, desc, asc, and, count, sql, inArray } from "drizzle-orm";
import { DB, db } from "@/db";
import {
  wpComments, wpCommentmeta, createCommentSchema, updateCommentSchema,
  commentIdSchema, commentIdsSchema, commentStatusSchema, commentListSchema, postCommentsSchema,
  createCommentMetaSchema, type InsertComment, type InsertCommentOutput,
  type SelectComment, type InsertCommentMeta, type SelectCommentMeta,
} from "@/db/schema/cms-comments";
import { wpPosts } from "@/db/schema/cms-posts";

type Id = bigint | string | number;
export class CommentMutationError extends Error {
  constructor(public readonly key: string) { super(key); }
}
async function commentTransaction<T>(database: DB, operation: (tx: DB) => Promise<T>): Promise<T> {
  return database.transaction(async transaction => {
    const tx = transaction as unknown as DB;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pressforge:comments'))`);
    return operation(tx);
  });
}
async function readComment(id: bigint, database: DB) {
  const [row] = await database.select().from(wpComments).where(eq(wpComments.commentId, id)).limit(1);
  return row ?? null;
}
async function syncCount(postId: bigint, database: DB): Promise<bigint> {
  const [result] = await database.select({ total: count() }).from(wpComments)
    .where(and(eq(wpComments.commentPostId, postId), eq(wpComments.commentApproved, "1")));
  const total = BigInt(result?.total ?? 0);
  await database.update(wpPosts).set({ commentCount: total }).where(eq(wpPosts.id, postId));
  return total;
}
export async function syncPostCommentCount(postId: Id, database: DB = db): Promise<bigint> {
  await verifyAdmin();
  const id = commentIdSchema.parse(postId);
  return commentTransaction(database, tx => syncCount(id, tx));
}
async function validateLinks(tx: DB, postId: bigint, parent: bigint, currentId?: bigint) {
  const [post] = await tx.select({ id: wpPosts.id }).from(wpPosts)
    .where(and(eq(wpPosts.id, postId), inArray(wpPosts.postType, ["post", "page"]))).limit(1);
  if (!post) throw new CommentMutationError("admin.comments.error.post");
  const visited = new Set<bigint>();
  let ancestor = parent;
  while (ancestor !== BigInt(0)) {
    if (ancestor === currentId || visited.has(ancestor) || visited.size >= 100)
      throw new CommentMutationError("admin.comments.error.parent");
    visited.add(ancestor);
    const row = await readComment(ancestor, tx);
    if (!row || row.commentPostId !== postId) throw new CommentMutationError("admin.comments.error.parent");
    ancestor = row.commentParent;
  }
}
export interface GetPostCommentsOptions { approvedOnly?: boolean; limit?: number; offset?: number; order?: "asc" | "desc" }
export interface ThreadedComment extends SelectComment { replies: ThreadedComment[] }
export interface ListCommentsOptions { postId?: Id; approved?: string; search?: string; userId?: string; limit?: number; offset?: number; order?: "asc" | "desc" }

export async function createComment(data: InsertComment, database: DB = db): Promise<SelectComment> {
  const session = await verifyAdmin();
  const parsed = createCommentSchema.parse(data);
  return commentTransaction(database, async tx => {
    await validateLinks(tx, parsed.commentPostId, parsed.commentParent);
    const [inserted] = await tx.insert(wpComments).values({ ...parsed, userId: session.user.id }).returning();
    if (!inserted) throw new CommentMutationError("admin.comments.error.failed");
    await syncCount(parsed.commentPostId, tx);
    return inserted;
  });
}
// These services return moderation data (including email/IP); all reads stay admin-only.
// There is currently no public comment submission/display integration in this application.
export async function getCommentById(id: Id, database: DB = db): Promise<SelectComment | null> {
  await verifyAdmin();
  return readComment(commentIdSchema.parse(id), database);
}
export async function getCommentsByPostId(postId: Id, options: GetPostCommentsOptions = {}, database: DB = db): Promise<SelectComment[]> {
  await verifyAdmin();
  const id = commentIdSchema.parse(postId);
  const { approvedOnly, limit, offset, order } = postCommentsSchema.parse(options);
  return database.select().from(wpComments)
    .where(and(eq(wpComments.commentPostId, id), approvedOnly ? eq(wpComments.commentApproved, "1") : undefined))
    .orderBy(order === "asc" ? asc(wpComments.commentDate) : desc(wpComments.commentDate)).limit(limit).offset(offset);
}
export async function getThreadedCommentsByPostId(postId: Id, options: Omit<GetPostCommentsOptions, "limit" | "offset"> = {}, database: DB = db): Promise<ThreadedComment[]> {
  const comments = await getCommentsByPostId(postId, { ...options, limit: 1000 }, database);
  const nodes = new Map(comments.map(comment => [comment.commentId, { ...comment, replies: [] as ThreadedComment[] }]));
  const roots: ThreadedComment[] = [];
  for (const comment of comments) {
    const node = nodes.get(comment.commentId)!;
    const seen = new Set<bigint>([node.commentId]);
    let parent = node.commentParent;
    let cyclic = false;
    while (parent !== BigInt(0) && nodes.has(parent)) {
      if (seen.has(parent) || seen.size >= 100) { cyclic = true; break; }
      seen.add(parent); parent = nodes.get(parent)!.commentParent;
    }
    if (cyclic || !nodes.has(node.commentParent)) roots.push(node);
    else nodes.get(node.commentParent)!.replies.push(node);
  }
  return roots;
}
export async function listComments(options: ListCommentsOptions = {}, database: DB = db): Promise<{ comments: SelectComment[]; total: number }> {
  await verifyAdmin();
  const { postId, approved, search, userId, limit, offset, order } = commentListSchema.parse(options);
  const term = `%${search ?? ""}%`;
  const where = and(postId ? eq(wpComments.commentPostId, postId) : undefined,
    approved ? eq(wpComments.commentApproved, approved) : undefined,
    userId ? eq(wpComments.userId, userId) : undefined,
    search ? sql`(${wpComments.commentContent} ILIKE ${term} OR ${wpComments.commentAuthor} ILIKE ${term} OR ${wpComments.commentAuthorEmail} ILIKE ${term})` : undefined);
  const [comments, totals] = await Promise.all([
    database.select().from(wpComments).where(where).orderBy(order === "asc" ? asc(wpComments.commentDate) : desc(wpComments.commentDate)).limit(limit).offset(offset),
    database.select({ total: count() }).from(wpComments).where(where),
  ]);
  return { comments, total: Number(totals[0]?.total ?? 0) };
}
export async function updateComment(id: Id, data: Partial<InsertCommentOutput>, database: DB = db): Promise<SelectComment | null> {
  await verifyAdmin();
  const commentId = commentIdSchema.parse(id);
  const parsed = updateCommentSchema.parse(data);
  return commentTransaction(database, async tx => {
    const existing = await readComment(commentId, tx);
    if (!existing) throw new CommentMutationError("admin.comments.error.missing");
    const postId = parsed.commentPostId ?? existing.commentPostId;
    if (!postId) throw new CommentMutationError("admin.comments.error.post");
    await validateLinks(tx, postId, parsed.commentParent ?? existing.commentParent, commentId);
    if (postId !== existing.commentPostId) {
      const [child] = await tx.select({ id: wpComments.commentId }).from(wpComments).where(eq(wpComments.commentParent, commentId)).limit(1);
      if (child) throw new CommentMutationError("admin.comments.error.parent");
    }
    const [updated] = await tx.update(wpComments).set(parsed).where(eq(wpComments.commentId, commentId)).returning();
    for (const affected of new Set([existing.commentPostId, postId])) if (affected) await syncCount(affected, tx);
    return updated ?? null;
  });
}
export async function updateCommentStatus(id: Id, status: "1" | "0" | "spam" | "trash" | "pending", database: DB = db) {
  return updateComment(id, { commentApproved: commentStatusSchema.parse(status) }, database);
}
async function mutateBatch(ids: bigint[], status: string | undefined, tx: DB) {
  const rows = await tx.select({ id: wpComments.commentId, postId: wpComments.commentPostId }).from(wpComments).where(inArray(wpComments.commentId, ids));
  if (rows.length !== ids.length) throw new CommentMutationError("admin.comments.error.missing");
  if (status !== undefined) await tx.update(wpComments).set({ commentApproved: status }).where(inArray(wpComments.commentId, ids));
  else {
    // Preserve surviving replies as roots, rather than retaining dangling parent IDs.
    await tx.update(wpComments).set({ commentParent: BigInt(0) }).where(inArray(wpComments.commentParent, ids));
    await tx.delete(wpComments).where(inArray(wpComments.commentId, ids));
  }
  for (const postId of new Set(rows.map(row => row.postId))) if (postId) await syncCount(postId, tx);
  return { success: true, count: rows.length };
}
export async function bulkUpdateCommentStatus(ids: Id[], status: string, database: DB = db) {
  await verifyAdmin();
  const parsed = commentIdsSchema.parse(ids);
  const target = commentStatusSchema.parse(status);
  return commentTransaction(database, tx => mutateBatch(parsed, target, tx));
}
export async function bulkDeleteComments(ids: Id[], database: DB = db) {
  await verifyAdmin();
  const parsed = commentIdsSchema.parse(ids);
  return commentTransaction(database, tx => mutateBatch(parsed, undefined, tx));
}
export async function deleteComment(id: Id, database: DB = db): Promise<boolean> {
  const result = await bulkDeleteComments([id], database);
  return result.count === 1;
}
export async function addCommentMeta(data: InsertCommentMeta, database: DB = db): Promise<SelectCommentMeta> {
  await verifyAdmin();
  const parsed = createCommentMetaSchema.parse(data);
  const [meta] = await database.insert(wpCommentmeta).values(parsed).returning();
  return meta;
}
export async function getCommentMeta(commentId: Id, metaKey?: string, database: DB = db): Promise<SelectCommentMeta[]> {
  await verifyAdmin();
  const id = commentIdSchema.parse(commentId);
  const key = metaKey === undefined ? undefined : createCommentMetaSchema.shape.metaKey.parse(metaKey);
  return database.select().from(wpCommentmeta).where(and(eq(wpCommentmeta.commentId, id), key ? eq(wpCommentmeta.metaKey, key) : undefined)).limit(1000);
}
export async function updateCommentMeta(commentId: Id, metaKey: string, metaValue: string, database: DB = db): Promise<SelectCommentMeta> {
  await verifyAdmin();
  const parsed = createCommentMetaSchema.parse({ commentId, metaKey, metaValue });
  return commentTransaction(database, async tx => {
    const [existing] = await tx.select().from(wpCommentmeta).where(and(eq(wpCommentmeta.commentId, parsed.commentId), eq(wpCommentmeta.metaKey, parsed.metaKey))).limit(1);
    if (existing) {
      const [updated] = await tx.update(wpCommentmeta).set({ metaValue: parsed.metaValue }).where(eq(wpCommentmeta.metaId, existing.metaId)).returning();
      return updated;
    }
    const [inserted] = await tx.insert(wpCommentmeta).values(parsed).returning();
    return inserted;
  });
}
export async function deleteCommentMeta(commentId: Id, metaKey?: string, database: DB = db): Promise<boolean> {
  await verifyAdmin();
  const id = commentIdSchema.parse(commentId);
  const key = metaKey === undefined ? undefined : createCommentMetaSchema.shape.metaKey.parse(metaKey);
  const rows = await database.delete(wpCommentmeta).where(and(eq(wpCommentmeta.commentId, id), key ? eq(wpCommentmeta.metaKey, key) : undefined)).returning();
  return rows.length > 0;
}
export const commentService = {
  create: createComment, getById: getCommentById, getByPostId: getCommentsByPostId, getThreadedByPostId: getThreadedCommentsByPostId,
  list: listComments, update: updateComment, updateStatus: updateCommentStatus, delete: deleteComment,
  bulkUpdateStatus: bulkUpdateCommentStatus, bulkDelete: bulkDeleteComments,
  syncPostCommentCount, addMeta: addCommentMeta, getMeta: getCommentMeta, updateMeta: updateCommentMeta, deleteMeta: deleteCommentMeta,
};
