import {
  pgTable,
  bigserial,
  bigint,
  text,
  varchar,
  integer,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// wp_terms — taxonomy entries: categories, tags, nav menus, custom taxonomies
// ---------------------------------------------------------------------------
export const wpTerms = pgTable(
  "wp_terms",
  {
    termId: bigserial("term_id", { mode: "bigint" }).primaryKey(),
    name: varchar("name", { length: 200 }).notNull().default(""),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    termGroup: bigint("term_group", { mode: "bigint" }).notNull().default(BigInt(0)),
  },
  (table) => [
    index("wp_terms_slug_idx").on(table.slug),
    index("wp_terms_name_idx").on(table.name),
  ],
);

// ---------------------------------------------------------------------------
// wp_termmeta — arbitrary key/value metadata per term (wp_termmeta)
// ---------------------------------------------------------------------------
export const wpTermmeta = pgTable(
  "wp_termmeta",
  {
    metaId: bigserial("meta_id", { mode: "bigint" }).primaryKey(),
    termId: bigint("term_id", { mode: "bigint" })
      .notNull()
      .references(() => wpTerms.termId, { onDelete: "cascade" }),
    metaKey: varchar("meta_key", { length: 255 }),
    metaValue: text("meta_value"),
  },
  (table) => [
    index("wp_termmeta_term_id_idx").on(table.termId),
    index("wp_termmeta_key_idx").on(table.metaKey),
  ],
);

// ---------------------------------------------------------------------------
// wp_term_taxonomy — describes which taxonomy a term belongs to (category, post_tag, nav_menu)
// ---------------------------------------------------------------------------
export const wpTermTaxonomy = pgTable(
  "wp_term_taxonomy",
  {
    termTaxonomyId: bigserial("term_taxonomy_id", { mode: "bigint" }).primaryKey(),
    termId: bigint("term_id", { mode: "bigint" })
      .notNull()
      .references(() => wpTerms.termId, { onDelete: "cascade" }),
    taxonomy: varchar("taxonomy", { length: 32 }).notNull().default(""),
    description: text("description").notNull().default(""),
    parent: bigint("parent", { mode: "bigint" }).notNull().default(BigInt(0)),
    count: bigint("count", { mode: "bigint" }).notNull().default(BigInt(0)),
  },
  (table) => [
    unique("wp_term_taxonomy_term_taxonomy_unique").on(table.termId, table.taxonomy),
    index("wp_term_taxonomy_taxonomy_idx").on(table.taxonomy),
  ],
);

// ---------------------------------------------------------------------------
// wp_term_relationships — links posts/objects to term-taxonomies (many-to-many)
// ---------------------------------------------------------------------------
export const wpTermRelationships = pgTable(
  "wp_term_relationships",
  {
    objectId: bigint("object_id", { mode: "bigint" }).notNull(),
    termTaxonomyId: bigint("term_taxonomy_id", { mode: "bigint" })
      .notNull()
      .references(() => wpTermTaxonomy.termTaxonomyId, { onDelete: "cascade" }),
    termOrder: integer("term_order").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.objectId, table.termTaxonomyId] }),
    index("wp_term_relationships_tax_idx").on(table.termTaxonomyId),
  ],
);

