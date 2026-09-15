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

