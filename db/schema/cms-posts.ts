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
import { user } from "./auth-schema";

// ---------------------------------------------------------------------------
// wp_usermeta — arbitrary key/value metadata per user (wp_usermeta).
// Profile fields, capabilities, and user preferences are stored here.
// The Better Auth `user` table is the source of truth for identity.
// ---------------------------------------------------------------------------
export const wpUsermeta = pgTable(
  "wp_usermeta",
  {
    umetaId: bigserial("umeta_id", { mode: "bigint" }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    metaKey: varchar("meta_key", { length: 255 }),
    metaValue: text("meta_value"),
  },
  (table) => [
    index("wp_usermeta_user_id_idx").on(table.userId),
    index("wp_usermeta_key_idx").on(table.metaKey),
  ],
);

// ---------------------------------------------------------------------------
// wp_posts — core content table (posts, pages, media, revisions, nav_menu_items)
// Matches classic WordPress wp_posts structure.
// post_author references Better Auth user.id.
// ---------------------------------------------------------------------------
export const wpPosts = pgTable(
  "wp_posts",
  {
    id: bigserial("ID", { mode: "bigint" }).primaryKey(),
    postAuthor: text("post_author").references(() => user.id, { onDelete: "set null" }),
    postDate: timestamp("post_date").defaultNow().notNull(),
    postDateGmt: timestamp("post_date_gmt").defaultNow().notNull(),
    postContent: text("post_content").notNull().default(""),
    postTitle: text("post_title").notNull().default(""),
    postExcerpt: text("post_excerpt").notNull().default(""),
    postStatus: varchar("post_status", { length: 20 }).notNull().default("publish"),
    commentStatus: varchar("comment_status", { length: 20 }).notNull().default("open"),
    pingStatus: varchar("ping_status", { length: 20 }).notNull().default("open"),
    postPassword: varchar("post_password", { length: 255 }).notNull().default(""),
    postName: varchar("post_name", { length: 200 }).notNull().default(""),
    toPing: text("to_ping").notNull().default(""),
    pinged: text("pinged").notNull().default(""),
    postModified: timestamp("post_modified").defaultNow().notNull(),
    postModifiedGmt: timestamp("post_modified_gmt").defaultNow().notNull(),
    postContentFiltered: text("post_content_filtered").notNull().default(""),
    postParent: bigint("post_parent", { mode: "bigint" }).notNull().default(BigInt(0)),
    guid: varchar("guid", { length: 255 }).notNull().default(""),
    menuOrder: integer("menu_order").notNull().default(0),
    postType: varchar("post_type", { length: 20 }).notNull().default("post"),
    postMimeType: varchar("post_mime_type", { length: 100 }).notNull().default(""),
    commentCount: bigint("comment_count", { mode: "bigint" }).notNull().default(BigInt(0)),
  },
  (table) => [
    index("wp_posts_name_idx").on(table.postName),
    index("wp_posts_type_status_date_idx").on(
      table.postType,
      table.postStatus,
      table.postDate,
      table.id,
    ),
    index("wp_posts_parent_idx").on(table.postParent),
    index("wp_posts_author_idx").on(table.postAuthor),
  ],
);

// ---------------------------------------------------------------------------
// wp_postmeta — arbitrary key/value metadata per post (wp_postmeta)
// ---------------------------------------------------------------------------
export const wpPostmeta = pgTable(
  "wp_postmeta",
  {
    metaId: bigserial("meta_id", { mode: "bigint" }).primaryKey(),
    postId: bigint("post_id", { mode: "bigint" })
      .notNull()
      .references(() => wpPosts.id, { onDelete: "cascade" }),
    metaKey: varchar("meta_key", { length: 255 }),
    metaValue: text("meta_value"),
  },
  (table) => [
    index("wp_postmeta_post_id_idx").on(table.postId),
    index("wp_postmeta_key_idx").on(table.metaKey),
  ],
);

