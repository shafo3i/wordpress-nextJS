import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core"
import { z } from "zod"
export const newsletterSubscribers = pgTable("cms_newsletter_subscribers", {
  email: text("email").primaryKey(),
  id: text("id").notNull().unique(),
  name: text("name"),
  source: text("source"),
  locale: text("locale"),
  status: text("status").notNull().default("pending"),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
  confirmationHash: text("confirmation_hash"),
  confirmationExpires: timestamp("confirmation_expires"),
  nextRequestAt: timestamp("next_request_at"),
})
export const newsletterRateLimits = pgTable("cms_newsletter_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetsAt: timestamp("resets_at").notNull(),
})
export const newsletterSubscribeSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    name: z.string().trim().max(150).default(""),
    source: z.string().trim().max(100).default("website_form"),
    locale: z.string().max(20).optional(),
    website: z.string().max(200).default(""),
  })
  .strict()
export const newsletterTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/)
export const newsletterSubscriberPageSchema = z.object({
  page: z.number().int().min(1).max(100000),
  locale: z
    .string()
    .max(20)
    .regex(/^$|^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/),
})
