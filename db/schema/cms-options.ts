import { pgTable, bigserial, text, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// ---------------------------------------------------------------------------
// wp_options — site-wide key/value configuration store (wp_options).
// Stores site name, active plugins, theme settings, widgets, transients.
// ---------------------------------------------------------------------------
export const wpOptions = pgTable(
  "wp_options",
  {
    optionId: bigserial("option_id", { mode: "bigint" }).primaryKey(),
    optionName: varchar("option_name", { length: 191 }).notNull().unique(),
    optionValue: text("option_value").notNull().default(""),
    autoload: varchar("autoload", { length: 20 }).notNull().default("yes"),
  },
  (table) => [
    index("wp_options_autoload_idx").on(table.autoload),
  ],
);

// ---------------------------------------------------------------------------
// wp_links — blogroll / external link manager (wp_links).
// Classic WordPress Links Manager table.
// ---------------------------------------------------------------------------
export const wpLinks = pgTable(
  "wp_links",
  {
    linkId: bigserial("link_id", { mode: "bigint" }).primaryKey(),
    linkUrl: varchar("link_url", { length: 255 }).notNull().default(""),
    linkName: varchar("link_name", { length: 255 }).notNull().default(""),
    linkImage: varchar("link_image", { length: 255 }).notNull().default(""),
    linkTarget: varchar("link_target", { length: 25 }).notNull().default(""),
    linkDescription: varchar("link_description", { length: 255 }).notNull().default(""),
    linkVisible: varchar("link_visible", { length: 20 }).notNull().default("Y"),
    linkOwner: text("link_owner").references(() => user.id, { onDelete: "set null" }),
    linkRating: integer("link_rating").notNull().default(0),
    linkUpdated: timestamp("link_updated").defaultNow().notNull(),
    linkRel: varchar("link_rel", { length: 255 }).notNull().default(""),
    linkNotes: text("link_notes").notNull().default(""),
    linkRss: varchar("link_rss", { length: 255 }).notNull().default(""),
  },
  (table) => [
    index("wp_links_visible_idx").on(table.linkVisible),
  ],
);

