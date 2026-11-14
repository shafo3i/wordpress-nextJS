import {
    pgTable,
    varchar,
    text,
    boolean,
    integer,
    bigint,
    bigserial,
    timestamp,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-orm/zod";
import { InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import { wpPosts } from "./cms-posts";
import { wpTermTaxonomy } from "./cms-taxonomy";

// ---------------------------------------------------------------------------
// cms_languages — Supported platform languages
// ---------------------------------------------------------------------------
export const languagesTable = pgTable(
    "cms_languages",
    {
        code: varchar("code", { length: 10 }).primaryKey(),
        name: varchar("name", { length: 100 }).notNull(),
        nativeName: varchar("native_name", { length: 100 }).notNull().default(""),
        direction: varchar("direction", { length: 3 }).notNull().default("ltr"),
        isDefault: boolean("is_default").notNull().default(false),
        isActive: boolean("is_active").notNull().default(true),
        displayOrder: integer("display_order").notNull().default(0),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("cms_languages_active_idx").on(table.isActive),
        index("cms_languages_order_idx").on(table.displayOrder),
    ]
);

// ---------------------------------------------------------------------------
// cms_translations — Key-value translations per language
// ---------------------------------------------------------------------------
export const translationsTable = pgTable(
    "cms_translations",
    {
        id: bigserial("id", { mode: "bigint" }).primaryKey(),
        languageCode: varchar("language_code", { length: 10 })
            .notNull()
            .references(() => languagesTable.code, { onDelete: "cascade" }),
        key: varchar("key", { length: 255 }).notNull(),
        value: text("value").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("cms_translations_lang_key_idx").on(table.languageCode, table.key),
        index("cms_translations_key_idx").on(table.key),
    ]
);

// ---------------------------------------------------------------------------
// cms_post_translations — Links posts to languages and translation groups
// ---------------------------------------------------------------------------
export const postTranslationsTable = pgTable(
    "cms_post_translations",
    {
        id: bigserial("id", { mode: "bigint" }).primaryKey(),
        postId: bigint("post_id", { mode: "bigint" })
            .notNull()
            .references(() => wpPosts.id, { onDelete: "cascade" }),
        languageCode: varchar("language_code", { length: 10 })
            .notNull()
            .references(() => languagesTable.code, { onDelete: "cascade" }),
        translationGroupId: varchar("translation_group_id", { length: 64 }).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("cms_post_trans_post_idx").on(table.postId),
        index("cms_post_trans_group_idx").on(table.translationGroupId),
        index("cms_post_trans_lang_group_idx").on(table.translationGroupId, table.languageCode),
    ]
);

// ---------------------------------------------------------------------------
// cms_term_translations — Links taxonomy terms to languages and translation groups
// ---------------------------------------------------------------------------
export const termTranslationsTable = pgTable(
    "cms_term_translations",
    {
        id: bigserial("id", { mode: "bigint" }).primaryKey(),
        termTaxonomyId: bigint("term_taxonomy_id", { mode: "bigint" })
            .notNull()
            .references(() => wpTermTaxonomy.termTaxonomyId, { onDelete: "cascade" }),
        languageCode: varchar("language_code", { length: 10 })
            .notNull()
            .references(() => languagesTable.code, { onDelete: "cascade" }),
        translationGroupId: varchar("translation_group_id", { length: 64 }).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("cms_term_trans_tax_idx").on(table.termTaxonomyId),
        index("cms_term_trans_group_idx").on(table.translationGroupId),
        index("cms_term_trans_lang_group_idx").on(table.translationGroupId, table.languageCode),
    ]
);

// ---------------------------------------------------------------------------
// Schemas & Types
// ---------------------------------------------------------------------------

export const languageCodeSchema = z.string().trim().min(2).max(10).regex(/^[a-z]{2,3}(?:[-_][a-z0-9]{2,8})*$/i).transform(value => value.toLowerCase());
const languageBooleanSchema = z.union([z.boolean(), z.enum(["true", "false", "on", "off"])]).transform(value => value === true || value === "true" || value === "on");
export const createLanguageSchema = createInsertSchema(languagesTable, {
  code: () => languageCodeSchema, name: () => z.string().trim().min(1).max(100),
  nativeName: () => z.string().trim().max(100).default(""), direction: () => z.enum(["ltr", "rtl"]).default("ltr"),
  isDefault: () => languageBooleanSchema.default(false), isActive: () => languageBooleanSchema.default(true),
  displayOrder: () => z.coerce.number().int().min(0).max(10000).default(0),
}).omit({ createdAt: true, updatedAt: true });
export const updateLanguageSchema = createLanguageSchema.omit({ code: true }).partial().extend({
  nativeName: z.string().trim().max(100).optional(), direction: z.enum(["ltr", "rtl"]).optional(),
  isDefault: languageBooleanSchema.optional(), isActive: languageBooleanSchema.optional(),
  displayOrder: z.coerce.number().int().min(0).max(10000).optional(),
});
export const translationKeySchema = z.string().min(1).max(255).refine(key => !key.split(".").some(part => ["__proto__", "prototype", "constructor"].includes(part)));
export const translationValueSchema = z.string().min(1).max(20000);
export const createTranslationSchema = createInsertSchema(translationsTable, {
  languageCode: () => languageCodeSchema, key: () => translationKeySchema, value: () => translationValueSchema,
}).omit({ id: true, createdAt: true, updatedAt: true });
export const updateTranslationSchema = createTranslationSchema.partial();
export const translationBatchSchema = z.unknown().superRefine((value, context) => {
  if (value && typeof value === "object" && Object.keys(value).some(key => !translationKeySchema.safeParse(key).success))
    context.addIssue({ code: "custom", message: "Invalid translation key" });
}).pipe(z.record(translationKeySchema, translationValueSchema)
  .refine(entries => Object.keys(entries).length <= 10000 && JSON.stringify(entries).length <= 5000000));
export const languageQuerySchema = z.object({
  status: z.enum(["all", "active", "inactive"]).optional(), search: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(100000).default(1), limit: z.number().int().min(1).max(100).default(20),
});
export const translationQuerySchema = languageQuerySchema.omit({ status: true }).extend({
  locale: languageCodeSchema.optional(), group: z.string().max(255).optional(),
  filter: z.enum(["all", "missing", "overridden"]).optional(),
});
export const translationGroupSchema = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/);
export const translationReturnUrlSchema = z.string().max(2000).refine(value => {
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return false;
  try { return new URL(value, "https://translations.invalid").pathname === "/admincp/translations"; } catch { return false; }
}).transform(value => { const url = new URL(value, "https://translations.invalid"); return url.pathname + url.search; });


export const createPostTranslationSchema = createInsertSchema(postTranslationsTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

// Type definitions
export type SelectLanguage = InferSelectModel<typeof languagesTable>;
export type InsertLanguage = z.input<typeof createLanguageSchema>;
export type InsertLanguageOutput = z.output<typeof createLanguageSchema>;

export type SelectTranslation = InferSelectModel<typeof translationsTable>;
export type InsertTranslation = z.input<typeof createTranslationSchema>;
export type InsertTranslationOutput = z.output<typeof createTranslationSchema>;

export type SelectPostTranslation = InferSelectModel<typeof postTranslationsTable>;
export type InsertPostTranslation = z.input<typeof createPostTranslationSchema>;
export type InsertPostTranslationOutput = z.output<typeof createPostTranslationSchema>;
