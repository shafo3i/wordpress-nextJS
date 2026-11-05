import { z } from "zod"

export const studioContentLocaleSchema = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-zA-Z0-9_-]+$/)
export const studioCategoryIdSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,18}$/)
  .refine(
    (value) =>
      /^[1-9][0-9]{0,18}$/.test(value) &&
      BigInt(value) <= BigInt("9223372036854775807")
  )
export const studioContentRequestSchema = z.object({
  locale: studioContentLocaleSchema,
  categoryId: studioCategoryIdSchema.optional(),
  categorySlug: z.string().min(1).max(200).default("all"),
  featuredOnly: z.preprocess(
    (value) =>
      value === "true" || value === "1"
        ? true
        : value === "false" || value === "0"
          ? false
          : value,
    z.boolean().default(false)
  ),
  pageSize: z.coerce.number().int().min(1).max(100).default(6),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  sort: z.enum(["newest", "oldest"]).default("newest"),
})
export type StudioContentRequest = z.output<typeof studioContentRequestSchema>
