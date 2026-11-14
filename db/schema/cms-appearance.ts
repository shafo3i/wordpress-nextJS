import { z } from "zod"
import { createInsertSchema } from "drizzle-orm/zod"
import { wpTerms, categoryIdSchema } from "./cms-taxonomy"
import { languageCodeSchema } from "./cms-languages"
import { safeMediaUrl } from "@/lib/post-media"

export const appearanceLocaleSchema = z.union([
  languageCodeSchema,
  z.literal("all"),
  z.literal(""),
])
export const appearanceUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) =>
      value === "" || /^#[^\s<>]*$/.test(value) || Boolean(safeMediaUrl(value))
  )
export const menuIdSchema = categoryIdSchema
export const menuLocationSchema = z
  .string()
  .max(40)
  .regex(
    /^(?:primary|footer|secondary|mobile)(?:_[a-z]{2,3}(?:[-_][a-z0-9]{2,8})*)?$/
  )
export const menuLocationsSchema = z
  .unknown()
  .refine(
    (value) =>
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length <= 100 &&
      Object.keys(value).every(
        (key) => !["__proto__", "constructor", "prototype"].includes(key)
      )
  )
  .pipe(z.record(menuLocationSchema, menuIdSchema.transform(String)))
const term = createInsertSchema(wpTerms).pick({ name: true, slug: true })
export const createMenuSchema = z.object({
  name: term.shape.name.unwrap().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .regex(/^[\p{L}\p{N}_-]*$/u)
    .optional(),
  language: appearanceLocaleSchema.optional(),
})
export const menuItemSchema = z.object({
  id: z
    .union([
      menuIdSchema.transform(String),
      z
        .string()
        .max(100)
        .regex(/^temp-[\w-]+$/),
    ])
    .optional(),
  title: z.string().trim().min(1).max(500),
  url: appearanceUrlSchema.refine(Boolean),
  order: z.number().int().min(0).max(500),
  target: z.enum(["_self", "_blank", ""]).optional(),
  type: z.enum(["page", "post", "category", "custom"]).optional(),
})
export const saveMenuSchema = createMenuSchema.omit({ slug: true }).extend({
  menuId: menuIdSchema,
  items: z
    .array(menuItemSchema)
    .max(200)
    .refine((items) => {
      const ids = items.map((item) => item.id).filter(Boolean)
      return new Set(ids).size === ids.length
    }),
  locations: z.array(menuLocationSchema).max(100),
})
export const menuQuerySchema = z.object({
  language: appearanceLocaleSchema.optional(),
  limit: z.number().int().min(1).max(200).default(20),
})
export { customizerModsSchema } from "./cms-customizer"
import { customizerModsSchema } from "./cms-customizer"
export const customizerSaveSchema = z.object({
  stylesheet: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  mods: customizerModsSchema,
  identity: z.object({
    siteTitle: z.string().trim().min(1).max(500),
    siteTagline: z.string().trim().max(2000),
  }),
  activate: z.boolean(),
})
export const widgetAreaIdSchema = z.enum([
  "sidebar_primary",
  "sidebar_secondary",
  "sidebar_category",
  "footer_1",
  "footer_2",
  "footer_3",
  "footer_4",
])
const widgetConfig = z
  .unknown()
  .superRefine((value, context) => {
    let nodes = 0
    const walk = (item: unknown, depth: number): boolean => {
      if (++nodes > 300 || depth > 4) return false
      if (typeof item === "string") return item.length <= 20_000
      if (typeof item === "number") return Number.isFinite(item)
      if (item === null || typeof item === "boolean") return true
      if (Array.isArray(item))
        return (
          item.length <= 50 && item.every((child) => walk(child, depth + 1))
        )
      if (item && typeof item === "object")
        return Object.entries(item).every(
          ([key, child]) =>
            !["__proto__", "constructor", "prototype"].includes(key) &&
            key.length <= 100 &&
            walk(child, depth + 1)
        )
      return false
    }
    if (!walk(value, 0))
      context.addIssue({
        code: "custom",
        message: "Invalid widget configuration",
      })
  })
  .pipe(z.record(z.string().max(100), z.unknown()))
export const widgetItemSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\w-]+$/),
  type: z.string().min(1).max(100),
  title: z.string().max(1000),
  content: z.string().max(100_000).optional(),
  count: z.number().int().min(1).max(100).optional(),
  pluginSlug: z.string().max(100).optional(),
  displayStyle: z.enum(["list", "card", "compact", "numbered"]).optional(),
  showThumbnail: z.boolean().optional(),
  showDate: z.boolean().optional(),
  showExcerpt: z.boolean().optional(),
  locale: appearanceLocaleSchema.optional(),
  config: widgetConfig.optional(),
})
export const widgetItemsSchema = z
  .array(widgetItemSchema)
  .max(50)
  .refine(
    (items) =>
      new Set(items.map((item) => item.id)).size === items.length &&
      JSON.stringify(items).length <= 500_000
  )
