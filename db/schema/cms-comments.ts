import { absoluteWebUrl } from "@/lib/seo/urls";
import {
  pgTable,
  bigserial,
  bigint,
  text,
  varchar,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { wpPosts } from "./cms-posts";
import { user } from "./auth-schema";
import { createInsertSchema } from "drizzle-orm/zod";
import { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

// ---------------------------------------------------------------------------
// wp_comments — comment threads on posts (wp_comments).
// user_id references Better Auth user.id.
// ---------------------------------------------------------------------------
export const wpComments = pgTable(
  "wp_comments",
  {
    commentId: bigserial("comment_ID", { mode: "bigint" }).primaryKey(),
    commentPostId: bigint("comment_post_ID", { mode: "bigint" }).references(
      () => wpPosts.id,
      { onDelete: "cascade" },
    ),
    commentAuthor: text("comment_author").notNull().default(""),
    commentAuthorEmail: varchar("comment_author_email", { length: 100 }).notNull().default(""),
    commentAuthorUrl: varchar("comment_author_url", { length: 200 }).notNull().default(""),
    commentAuthorIp: varchar("comment_author_IP", { length: 100 }).notNull().default(""),
    commentDate: timestamp("comment_date").defaultNow().notNull(),
    commentDateGmt: timestamp("comment_date_gmt").defaultNow().notNull(),
    commentContent: text("comment_content").notNull().default(""),
    commentKarma: integer("comment_karma").notNull().default(0),
    commentApproved: varchar("comment_approved", { length: 20 }).notNull().default("1"),
    commentAgent: varchar("comment_agent", { length: 255 }).notNull().default(""),
    commentType: varchar("comment_type", { length: 20 }).notNull().default("comment"),
    commentParent: bigint("comment_parent", { mode: "bigint" }).notNull().default(BigInt(0)),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [
    index("wp_comments_post_id_idx").on(table.commentPostId),
    index("wp_comments_approved_date_idx").on(table.commentApproved, table.commentDateGmt),
    index("wp_comments_date_gmt_idx").on(table.commentDateGmt),
    index("wp_comments_parent_idx").on(table.commentParent),
    index("wp_comments_email_idx").on(table.commentAuthorEmail),
  ],
);

// ---------------------------------------------------------------------------
// wp_commentmeta — arbitrary key/value metadata per comment (wp_commentmeta)
// ---------------------------------------------------------------------------
export const wpCommentmeta = pgTable(
  "wp_commentmeta",
  {
    metaId: bigserial("meta_id", { mode: "bigint" }).primaryKey(),
    commentId: bigint("comment_id", { mode: "bigint" })
      .notNull()
      .references(() => wpComments.commentId, { onDelete: "cascade" }),
    metaKey: varchar("meta_key", { length: 255 }),
    metaValue: text("meta_value"),
  },
  (table) => [
    index("wp_commentmeta_comment_id_idx").on(table.commentId),
    index("wp_commentmeta_key_idx").on(table.metaKey),
  ],
);



const commentIntegerSchema = z.union([
  z.bigint(), z.string().regex(/^\d{1,19}$/).transform(value => BigInt(value)),
  z.number().int().nonnegative().refine(Number.isSafeInteger).transform(value => BigInt(value)),
]).pipe(z.bigint().min(BigInt(0)).max(BigInt("9223372036854775807")));
export const commentIdSchema = commentIntegerSchema.refine(value => value > BigInt(0));
export const commentStatusSchema = z.enum(["0", "1", "spam", "trash", "pending"]).transform(value => value === "pending" ? "0" : value);
export const createCommentSchema = createInsertSchema(wpComments, {
  commentPostId: () => commentIdSchema,
  commentAuthor: () => z.string().trim().min(1).max(255),
  commentAuthorEmail: () => z.string().trim().email().max(100),
  commentAuthorUrl: () => z.string().trim().max(200).refine(value => value === "" || !!absoluteWebUrl(value)).default(""),
  commentContent: () => z.string().trim().min(1).max(20000),
  commentApproved: () => commentStatusSchema.default("0"),
  commentType: () => z.enum(["comment", "pingback", "trackback"]).default("comment"),
  commentParent: () => commentIntegerSchema.default(BigInt(0)),
}).pick({ commentPostId: true, commentAuthor: true, commentAuthorEmail: true, commentAuthorUrl: true,
  commentContent: true, commentApproved: true, commentType: true, commentParent: true }).extend({ commentPostId: commentIdSchema });
export const updateCommentSchema = createCommentSchema.partial().extend({
  commentAuthorUrl: z.string().trim().max(200).refine(value => value === "" || !!absoluteWebUrl(value)).optional(),
  commentApproved: commentStatusSchema.optional(),
  commentType: z.enum(["comment", "pingback", "trackback"]).optional(),
  commentParent: commentIntegerSchema.optional(),
});
export const commentIdsSchema = z.array(commentIdSchema).min(1).max(100).transform(ids => [...new Set(ids)]);
export const commentStatusMutationSchema = z.object({ id: commentIdSchema, status: commentStatusSchema });
export const commentQuerySchema = z.object({
  status: z.enum(["all", "0", "1", "spam", "trash", "pending"]).optional(),
  search: z.string().trim().max(200).optional(),
  commentType: z.enum(["all", "comment", "pings", "pingback", "trackback"]).optional(),
  language: z.string().max(10).optional(),
  page: z.number().int().min(1).max(100000).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export const commentListSchema = z.object({
  postId: commentIdSchema.optional(), approved: commentStatusSchema.optional(),
  search: z.string().trim().max(200).optional(), userId: z.string().max(255).optional(),
  limit: z.number().int().min(1).max(1000).default(20),
  offset: z.number().int().min(0).max(10000000).default(0), order: z.enum(["asc", "desc"]).default("desc"),
});
export const postCommentsSchema = commentListSchema.pick({ limit: true, offset: true, order: true }).extend({ approvedOnly: z.boolean().default(true) });
export const createCommentMetaSchema = createInsertSchema(wpCommentmeta, {
  commentId: () => commentIdSchema,
  metaKey: () => z.string().trim().min(1).max(255),
  metaValue: () => z.string().max(20000).nullable().optional(),
}).omit({ metaId: true }).extend({ metaKey: z.string().trim().min(1).max(255) });

// Type definitions
export type SelectComment = InferSelectModel<typeof wpComments>;
export type InsertComment = z.input<typeof createCommentSchema>;
export type InsertCommentOutput = z.output<typeof createCommentSchema>;

export type SelectCommentMeta = InferSelectModel<typeof wpCommentmeta>;
export type InsertCommentMeta = z.input<typeof createCommentMetaSchema>;
export type InsertCommentMetaOutput = z.output<typeof createCommentMetaSchema>;

// Aliases for compatibility
export const insertCommentSchema = createCommentSchema;
export type InsertCommentSchema = InsertComment;
export type SelectCommentSchema = SelectComment;

