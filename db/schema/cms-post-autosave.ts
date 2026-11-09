import { z } from "zod"

export const AUTOSAVE_MAX_BYTES = 4 * 1024 * 1024
export const AUTOSAVE_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const autosaveDocumentKey = z
  .string()
  .max(100)
  .regex(
    /^(?:post:[1-9]\d{0,18}|new:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
  )
  .refine(
    (value) =>
      !value.startsWith("post:") ||
      (/^post:[1-9]\d*$/.test(value) &&
        BigInt(value.slice(5)) <= BigInt("9223372036854775807"))
  )
export const postEditorSnapshotSchema = z
  .object({
    title: z.string().max(10000),
    content: z.string().max(2_000_000),
    excerpt: z.string().max(100000),
    featuredImageId: z.string().max(40),
    isFeatured: z.boolean(),
    status: z.string().max(20),
    template: z.string().max(100),
    postParent: z.string().max(40),
    menuOrder: z.number().int(),
    selectedCategories: z.array(z.string().max(300)).max(500),
    tagList: z.array(z.string().max(300)).max(500),
    languageCode: z.string().max(30),
    customSlug: z.string().max(300),
    seo: z
      .object({
        seoTitle: z.string().max(10000).optional(),
        seoDescription: z.string().max(10000).optional(),
        seoOgImage: z.string().max(10000).optional(),
        seoNoindex: z.boolean().optional(),
        seoCanonical: z.string().max(10000).optional(),
      })
      .strict(),
  })
  .strict()
export const postAutosaveRequestSchema = z
  .object({
    documentKey: autosaveDocumentKey,
    ownerId: z.string().min(1).max(200),
    expectedVersion: z.number().int().min(0),
    baseModified: z.string().max(50),
    snapshot: postEditorSnapshotSchema,
  })
  .strict()
export type PostEditorSnapshot = z.infer<typeof postEditorSnapshotSchema>
export type PostAutosaveRequest = z.infer<typeof postAutosaveRequestSchema>
export const postAutosaveRecordSchema = postAutosaveRequestSchema
  .omit({ expectedVersion: true, ownerId: true })
  .extend({
    version: z.number().int().positive(),
    savedAt: z.string().datetime(),
  })
export type PostAutosaveRecord = z.infer<typeof postAutosaveRecordSchema>
