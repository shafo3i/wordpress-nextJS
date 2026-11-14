import { createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { wpPosts } from "./cms-posts";
import { categoryIdSchema } from "./cms-taxonomy";
import { languageCodeSchema } from "./cms-languages";

export const pageIdSchema = categoryIdSchema;
const optionalId = z.preprocess(value => value === "" || value == null ? undefined : value, pageIdSchema.optional());
const parentId = z.preprocess(value => value === "" || value == null ? "0" : value,
  z.union([z.literal("0"), z.literal(0), z.literal(BigInt(0)), pageIdSchema]).transform(String));
export const pageStatusSchema = z.enum(["publish", "draft", "pending", "private", "trash"]);
export const pageTemplateSchema = z.enum(["default", "full-width", "with-sidebar", "landing", "studio_full_width", "studio_canvas"]);
const columns = createInsertSchema(wpPosts).pick({ postTitle: true, postContent: true, postExcerpt: true, postName: true, postPassword: true });
export const createPageSchema = z.object({
  title: columns.shape.postTitle.unwrap().trim().min(1).max(1000),
  content: columns.shape.postContent.unwrap().max(1_000_000).optional(),
  excerpt: columns.shape.postExcerpt.unwrap().max(20_000).optional(),
  slug: columns.shape.postName.unwrap().trim().max(200).optional(),
  status: pageStatusSchema.optional(),
  commentStatus: z.enum(["open", "closed"]).optional(),
  pingStatus: z.enum(["open", "closed"]).optional(),
  postPassword: columns.shape.postPassword.unwrap().max(255).optional(),
  postParent: parentId.optional(),
  menuOrder: z.coerce.number().int().min(-2147483648).max(2147483647).optional(),
  template: pageTemplateSchema.optional(),
  featuredImageId: z.union([z.literal(""), pageIdSchema.transform(String)]).optional(),
  languageCode: z.preprocess(value => value === "" || value == null ? undefined : value, languageCodeSchema.optional()),
  translationOf: optionalId.transform(value => value?.toString()).optional(),
});
export const updatePageSchema = createPageSchema.extend({ id: pageIdSchema.transform(String) });
export const quickUpdatePageSchema = updatePageSchema.pick({ id: true, title: true, slug: true, status: true, postParent: true, menuOrder: true, commentStatus: true, postPassword: true }).extend({
  date: z.union([z.iso.datetime({ offset: true }), z.literal("")]).optional(),
});
export const pageIdsSchema = z.array(pageIdSchema).min(1).max(100).transform(ids => [...new Set(ids)]);
export const pageQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.union([pageStatusSchema, z.literal("")]).optional(),
  date: z.union([z.enum(["today", "month"]), z.literal("")]).optional(),
  language: z.union([languageCodeSchema, z.literal("all"), z.literal("")]).optional(),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(["menuOrder", "postModified", "postDate", "postTitle"]).default("menuOrder"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type SelectPage = typeof wpPosts.$inferSelect;
export type InsertPage = z.input<typeof createPageSchema>;
export type InsertPageOutput = z.output<typeof createPageSchema>;
