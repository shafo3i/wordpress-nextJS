import { z } from "zod"
export const mediaItemIdSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER)
export const mediaDetailsPatchSchema = z
  .object({
    title: z.string().max(2000).optional(),
    altText: z.string().max(4000).optional(),
    caption: z.string().max(20000).optional(),
    description: z.string().max(100000).optional(),
  })
  .strict()
export type MediaDetailsPatch = z.infer<typeof mediaDetailsPatchSchema>

export const mediaDeleteIdsSchema = z.array(mediaItemIdSchema).min(1).max(100)
  .transform(ids => [...new Set(ids)])
export const mediaListQuerySchema = z.object({
  type: z.enum(["all", "image", "video", "audio", "document"]).optional(),
  month: z.string().regex(/^(?:all|\d{4}-(?:0[1-9]|1[0-2]))$/).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.number().int().min(1).max(100000).default(1),
  perPage: z.number().int().min(1).max(100).default(40),
})
