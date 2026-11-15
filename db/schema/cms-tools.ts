import { z } from "zod"
import { categoryIdSchema } from "./cms-taxonomy"

const safeUrl = (value: string) => {
  if (
    /[\\\u0000-\u0020\u007f]|%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(value) ||
    value.startsWith("//")
  )
    return false
  try {
    const url = new URL(value, "https://local.invalid")
    return (
      (value.startsWith("/") || /^https?:\/\//i.test(value)) &&
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    )
  } catch {
    return false
  }
}
export const redirectTargetSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(safeUrl)
export const redirectSourceSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine((value) => {
    if (!value.startsWith("/") || !safeUrl(value) || /[?#]/.test(value))
      return false
    try {
      return !/^\/(?:api|admincp|cms-admin|cms-login|_next)(?:\/|$)/i.test(
        decodeURI(value)
      )
    } catch {
      return false
    }
  })
  .transform((value) => decodeURI(value).replace(/\/+$/, "") || "/")
export const redirectIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w-]+$/)
export const redirectInputSchema = z.object({
  sourcePath: redirectSourceSchema,
  targetUrl: redirectTargetSchema,
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
  notes: z.string().trim().max(1000).default(""),
})
export const searchReplaceSchema = z.object({
  search: z.string().min(1).max(2000),
  replace: z.string().max(2000),
  dryRun: z.boolean().default(true),
  tables: z
    .array(z.enum(["wp_posts", "wp_postmeta", "wp_options", "wp_comments"]))
    .min(1)
    .max(4)
    .transform((items) => [...new Set(items)])
    .default(["wp_posts", "wp_postmeta", "wp_options", "wp_comments"]),
})
export const cleanupActionsSchema = z
  .array(
    z.enum([
      "revisions",
      "auto_drafts",
      "spam_comments",
      "orphaned_meta",
      "orphaned_terms",
      "transients",
      "vacuum",
    ])
  )
  .min(1)
  .max(7)
  .transform((items) => [...new Set(items)])
export const mediaRegenerateSchema = z.object({
  afterId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  generateWebp: z.boolean().default(true),
  onlyMissing: z.boolean().default(true),
  attachmentIds: z
    .array(z.number().int().positive().max(Number.MAX_SAFE_INTEGER))
    .min(1)
    .max(100)
    .optional(),
})
export const orphanCleanupSchema = z.object({
  filePaths: z.array(z.string().min(1).max(2000)).min(1).max(100),
  action: z.enum(["quarantine", "delete"]),
})
const filterId = z
  .union([z.literal("all"), categoryIdSchema.transform(String)])
  .optional()
export const exportFiltersSchema = z
  .object({
    format: z.enum(["xml", "sql", "json"]).default("xml"),
    content: z.enum(["all", "post", "page"]).default("all"),
    status: z
      .enum([
        "all",
        "publish",
        "draft",
        "pending",
        "private",
        "trash",
        "future",
      ])
      .default("all"),
    categoryId: filterId,
    authorId: z.string().min(1).max(200).optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
  })
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.startDate <= value.endDate
  )
export const importTextSchema = z
  .string()
  .min(1)
  .max(20 * 1024 * 1024)

export const storageInventorySchema = z.object({
  scope: z.string().regex(/^[a-f0-9]{64}$/),
  fileCount: z.number().int().nonnegative().max(100000),
  totalBytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  scannedAt: z.iso.datetime(),
})
