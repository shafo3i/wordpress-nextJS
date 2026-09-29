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
import { createInsertSchema } from "drizzle-orm/zod";
import { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

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
);

// ---------------------------------------------------------------------------
// Zod Schemas & Types
// ---------------------------------------------------------------------------
export const createTermSchema = createInsertSchema(wpTerms, {
  name: (schema) => schema.min(1, "Term name is required").max(200),
  slug: (schema) => schema.max(200).default(""),
  termGroup: () =>
    z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? BigInt(0) : val),
      z.coerce.bigint().default(BigInt(0))
    ),
}).omit({
  termId: true,
});

export const createTermTaxonomySchema = createInsertSchema(wpTermTaxonomy, {
  termId: () =>
    z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : val),
      z.coerce.bigint({ message: "Term ID must be a valid ID" }).positive()
    ),
  taxonomy: (schema) => schema.max(32).default("category"),
  description: () => z.string().default(""),
  parent: () =>
    z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? BigInt(0) : val),
      z.coerce.bigint().default(BigInt(0))
    ),
  count: () =>
    z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? BigInt(0) : val),
      z.coerce.bigint().default(BigInt(0))
    ),
}).omit({
  termTaxonomyId: true,
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(200),
  slug: z.string().max(200).optional().default(""),
  parent: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? BigInt(0) : val),
    z.coerce.bigint().default(BigInt(0))
  ),
  description: z.string().optional().default(""),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  termId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.bigint({ message: "Term ID is required" }).positive()
  ),
});

// Type definitions
export type SelectTerm = InferSelectModel<typeof wpTerms>;
export type InsertTerm = z.input<typeof createTermSchema>;
export type InsertTermOutput = z.output<typeof createTermSchema>;

export type SelectTermTaxonomy = InferSelectModel<typeof wpTermTaxonomy>;
export type InsertTermTaxonomy = z.input<typeof createTermTaxonomySchema>;
export type InsertTermTaxonomyOutput = z.output<typeof createTermTaxonomySchema>;

export type CategoryInput = z.input<typeof createCategorySchema>;
export type CategoryInputOutput = z.output<typeof createCategorySchema>;
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(200),
  slug: z.string().max(200).optional().default(""),
  description: z.string().optional().default(""),
});

export const updateTagSchema = createTagSchema.partial().extend({
  termId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.bigint({ message: "Term ID is required" }).positive()
  ),
});

export type TagInput = z.input<typeof createTagSchema>;
export type TagInputOutput = z.output<typeof createTagSchema>;
export type UpdateTagInput = z.input<typeof updateTagSchema>;

export type SelectTermRelationship = InferSelectModel<typeof wpTermRelationships>;

