import { z } from "zod"
import { createInsertSchema } from "drizzle-orm/zod"
import { wpPosts } from "./cms-posts"
import { categoryIdSchema } from "./cms-taxonomy"
import { languageCodeSchema } from "./cms-languages"
import { safeMediaUrl } from "@/lib/post-media"

export const postIdSchema = categoryIdSchema
export const postIdsSchema = z
  .array(postIdSchema)
  .min(1)
  .max(100)
  .transform((ids) => [...new Set(ids)])
export { featuredVideoSchema } from "./cms-featured-video"
import { featuredVideoSchema } from "./cms-featured-video"
const url = z
  .string()
  .max(2000)
  .refine((value) => value === "" || Boolean(safeMediaUrl(value)))
const postColumns = createInsertSchema(wpPosts).pick({
  postTitle: true,
  postContent: true,
  postExcerpt: true,
  postPassword: true,
})
export const postStatusSchema = z.enum([
  "draft",
  "publish",
  "pending",
  "private",
  "trash",
])
export const postSeoSchema = z.object({
  seoTitle: z.string().max(1000).optional(),
  seoDescription: z.string().max(5000).optional(),
  seoOgImage: url.optional(),
  seoNoindex: z.boolean().optional(),
  seoCanonical: url.optional(),
})
export const createPostEditorSchema = z.object({
  title: postColumns.shape.postTitle.unwrap().trim().min(1).max(10_000),
  content: postColumns.shape.postContent.unwrap().max(2_000_000).optional(),
  excerpt: postColumns.shape.postExcerpt.unwrap().max(100_000).optional(),
  slug: z.string().trim().max(200).optional(),
  status: postStatusSchema.optional(),
  commentStatus: z.enum(["open", "closed"]).optional(),
  pingStatus: z.enum(["open", "closed"]).optional(),
  postPassword: postColumns.shape.postPassword.unwrap().max(255).optional(),
  postParent: z
    .union([z.literal("0"), z.literal(0), postIdSchema.transform(String)])
    .optional(),
  menuOrder: z.number().int().min(-2147483648).max(2147483647).optional(),
  featuredImageId: z
    .union([z.literal(""), postIdSchema.transform(String)])
    .optional(),
  featuredVideoUrl: featuredVideoSchema.optional(),
  isFeatured: z.boolean().optional(),
  categorySlugs: z
    .array(z.string().min(1).max(200))
    .max(200)
    .transform((values) => [...new Set(values)])
    .optional(),
  tags: z
    .array(z.string().trim().min(1).max(200))
    .max(200)
    .transform((values) => [...new Set(values)])
    .optional(),
  languageCode: languageCodeSchema.optional(),
  translationOf: postIdSchema.optional(),
  seo: postSeoSchema.optional(),
  expectedModified: z.iso.datetime().optional(),
  date: z.iso.datetime({ offset: true }).optional(),
})
export const updatePostEditorSchema = createPostEditorSchema.partial()
export const quickPostEditorSchema = updatePostEditorSchema.extend({
  id: postIdSchema.transform(String),
  title: z.string().trim().min(1).max(10_000),
  tags: z
    .union([z.string().max(40_000), z.array(z.string().max(200)).max(200)])
    .optional(),
})
export const postQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.union([postStatusSchema, z.enum(["all", ""])]).optional(),
  date: z.string().max(20).optional(),
  from: z.string().max(20).optional(),
  to: z.string().max(20).optional(),
  category: z.string().max(200).optional(),
  language: z.union([languageCodeSchema, z.enum(["all", ""])]).optional(),
  page: z.number().int().min(1).max(100_000).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  orderBy: z
    .enum(["postModified", "postDate", "postTitle", "viewCount"])
    .optional(),
  order: z.enum(["asc", "desc"]).optional(),
})
export type SelectPostEditor = typeof wpPosts.$inferSelect
export type InsertPostEditor = z.input<typeof createPostEditorSchema>
export type InsertPostEditorOutput = z.output<typeof createPostEditorSchema>
