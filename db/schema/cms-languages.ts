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
import { createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";
import { InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import { wpPosts } from "./cms-posts";

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
// Schemas & Types
// ---------------------------------------------------------------------------

export const createLanguageSchema = createInsertSchema(languagesTable, {
    code: (schema) =>
        schema.min(2, "Language code must be at least 2 characters").max(10, "Language code cannot exceed 10 characters"),
    name: (schema) => schema.min(1, "Language name is required").max(100),
    nativeName: (schema) => schema.max(100).optional(),
    direction: () => z.enum(["ltr", "rtl"]).default("ltr"),
    isDefault: () => z.boolean().default(false),
    isActive: () => z.boolean().default(true),
    displayOrder: () => z.coerce.number().default(0),
}).omit({
    createdAt: true,
    updatedAt: true,
});

export const updateLanguageSchema = createUpdateSchema(languagesTable).omit({
    createdAt: true,
    updatedAt: true,
});

export const createTranslationSchema = createInsertSchema(translationsTable, {
    languageCode: (schema) => schema.min(2).max(10),
    key: (schema) => schema.min(1, "Translation key is required").max(255),
    value: (schema) => schema.min(1, "Translation text cannot be empty"),
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const updateTranslationSchema = createUpdateSchema(translationsTable).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

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
