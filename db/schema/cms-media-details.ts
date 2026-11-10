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
