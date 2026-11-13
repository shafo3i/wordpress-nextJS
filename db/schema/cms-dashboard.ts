import { z } from "zod"
export const quickDraftSchema = z
  .object({
    title: z.string().trim().max(300),
    content: z.string().trim().max(100000),
  })
  .strict()
  .refine((value) => !!(value.title || value.content))
