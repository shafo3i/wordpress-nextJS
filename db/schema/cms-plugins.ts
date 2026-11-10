import { z } from "zod"
import { safeMediaUrl } from "@/lib/post-media"

export const pluginSlugSchema = z.enum([
  "newsletter",
  "related-posts",
  "ad-manager",
  "fact-check",
  "breaking-news",
  "article-audio",
  "table-of-contents",
  "reading-time",
  "social-share",
])
export const retiredPlugins = new Set<string>(["reading-time", "social-share"])
const text = z.string().max(4000)
const url = z
  .string()
  .max(2048)
  .refine((value) => !value || !!safeMediaUrl(value))
export const pluginConfigSchemas = {
  newsletter: z
    .object({
      brandName: text,
      pitch: text,
      buttonText: text,
      sendWelcomeEmail: z.boolean(),
      welcomeSubject: text,
      welcomeMessage: text,
      translations: z.record(
        z.string().regex(/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/),
        z
          .object({ brandName: text, pitch: text, buttonText: text })
          .partial()
          .strict()
      ),
    })
    .partial()
    .strict(),
  "related-posts": z
    .object({
      count: z.coerce.number().int().min(1).max(12),
      matchStrategy: z.enum(["categories", "tags", "recent"]),
      displayStyle: z.enum(["list", "grid"]),
      showThumbnail: z.boolean(),
      showDate: z.boolean(),
    })
    .partial()
    .strict(),
  "ad-manager": z
    .object({
      enabled: z.boolean(),
      sponsorName: text,
      imageUrl: url,
      targetUrl: url,
      customHtml: z.string().max(20000),
      placement: z.enum(["before_content", "below_content"]),
    })
    .partial()
    .strict(),
  "fact-check": z
    .object({
      organization: text,
      summary: text,
      defaultRating: z.enum(["unreviewed", "verified"]),
    })
    .partial()
    .strict(),
  "breaking-news": z
    .object({
      enabled: z.boolean(),
      urgency: z.enum(["urgent", "developing", "alert"]),
      badgeText: text,
      headline: text,
      targetUrl: url,
      enablePulse: z.boolean(),
    })
    .partial()
    .strict(),
  "article-audio": z
    .object({
      audioUrl: url,
      stationName: text,
      episodeTitle: text,
      host: text,
      duration: z.string().max(30),
      enableSpeechSynthesis: z.boolean(),
    })
    .partial()
    .strict(),
  "table-of-contents": z
    .object({
      minHeadings: z.coerce.number().int().min(1).max(20),
      levels: z.array(z.enum(["h2", "h3"])).min(1),
      collapsible: z.boolean(),
      title: text,
    })
    .partial()
    .strict(),
  "reading-time": z.object({}).strict(),
  "social-share": z.object({}).strict(),
}
export const pluginBulkSchema = z
  .object({
    slugs: z.array(pluginSlugSchema).min(1).max(9),
    action: z.enum(["activate", "deactivate", "delete"]),
  })
  .strict()

export type PluginConfigMap = {
  [K in keyof typeof pluginConfigSchemas]: z.infer<
    (typeof pluginConfigSchemas)[K]
  >
}
export type PluginFormConfig = Record<string, unknown> & {
  translations?: Record<string, Record<string, string>>
}
