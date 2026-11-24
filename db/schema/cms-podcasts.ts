import { createInsertSchema } from "drizzle-orm/zod"
import { z } from "zod"
import { wpTerms } from "./cms-taxonomy"
import { languageCodeSchema } from "./cms-languages"

export const podcastShowIdSchema = z
  .string()
  .regex(/^[1-9]\d{0,15}$/)
  .refine(
    (value) =>
      /^[1-9]\d{0,15}$/.test(value) &&
      BigInt(value) <= BigInt(Number.MAX_SAFE_INTEGER)
  )
const optionalId = z.union([z.literal(""), podcastShowIdSchema]).default("")
export const podcastShowSchema = createInsertSchema(wpTerms)
  .pick({ name: true, slug: true })
  .extend({
    id: optionalId,
    name: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .max(200)
      .regex(/^[\p{L}\p{N}_-]*$/u)
      .default(""),
    description: z.string().trim().max(10000).default(""),
    languageCode: languageCodeSchema,
    status: z.enum(["draft", "published"]).default("draft"),
    presenters: z.string().trim().max(1000).default(""),
    website: z
      .string()
      .trim()
      .max(2000)
      .refine((value) => {
        if (!value) return true
        try {
          const url = new URL(value)
          return url.protocol === "https:" && !url.username && !url.password
        } catch {
          return false
        }
      })
      .default(""),
    artworkId: optionalId,
  })
export const podcastShowMetadataSchema = podcastShowSchema.pick({
  status: true,
  presenters: true,
  website: true,
  artworkId: true,
})
export const podcastShowQuerySchema = z.object({
  search: z.string().trim().max(200).default(""),
  language: z.union([z.literal("all"), languageCodeSchema]).default("all"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  id: podcastShowIdSchema.optional(),
})
export type InsertPodcastShow = z.input<typeof podcastShowSchema>
export type InsertPodcastShowOutput = z.output<typeof podcastShowSchema>
export type SelectPodcastShow = InsertPodcastShowOutput & {
  id: string
  taxonomyId: string
}
