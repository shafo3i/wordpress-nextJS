import { and, eq, sql, desc } from "drizzle-orm"
import { randomBytes, randomUUID } from "node:crypto"
import { db, type DB } from "@/db"
import {
  newsletterSubscribers as subscribers,
  newsletterRateLimits,
} from "@/db/schema/cms-newsletter"
import { newsletterTokenHash } from "./tokens"

export interface NewsletterSubscriber {
  id: string
  email: string
  name?: string
  subscribedAt: string
  source?: string
  locale?: string
  status: "pending" | "active" | "unsubscribed"
}
export async function getNewsletterSubscribers(
  database: DB = db
): Promise<NewsletterSubscriber[]> {
  const rows = await database
    .select()
    .from(subscribers)
    .orderBy(desc(subscribers.subscribedAt))
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name || undefined,
    source: r.source || undefined,
    locale: r.locale || undefined,
    status: r.status as NewsletterSubscriber["status"],
    subscribedAt: r.subscribedAt.toISOString(),
  }))
}
export async function newsletterRequestAllowed(database: DB = db) {
  // Distributed limit: no per-process map and no trust in spoofable IP headers.
  const now = new Date()
  const [row] = await database
    .insert(newsletterRateLimits)
    .values({
      key: "subscription-email",
      count: 1,
      resetsAt: new Date(now.getTime() + 3600000),
    })
    .onConflictDoUpdate({
      target: newsletterRateLimits.key,
      set: {
        count: sql`case when ${newsletterRateLimits.resetsAt} <= ${now} then 1 else ${newsletterRateLimits.count} + 1 end`,
        resetsAt: sql`case when ${newsletterRateLimits.resetsAt} <= ${now} then ${new Date(now.getTime() + 3600000)} else ${newsletterRateLimits.resetsAt} end`,
      },
    })
    .returning({ count: newsletterRateLimits.count })
  return row.count <= 60
}
export async function addNewsletterSubscriber(
  email: string,
  options?: { name?: string; source?: string; locale?: string },
  database: DB = db
) {
  const normalized = email.trim().toLowerCase(),
    token = randomBytes(32).toString("base64url"),
    now = new Date()
  const fields = {
    name: options?.name || "",
    source: options?.source || "website_form",
    locale: options?.locale || "",
    status: "pending",
    confirmationHash: newsletterTokenHash(token),
    confirmationExpires: new Date(now.getTime() + 86400000),
    nextRequestAt: new Date(now.getTime() + 600000),
  }
  const [saved] = await database
    .insert(subscribers)
    .values({
      email: normalized,
      id: randomUUID(),
      subscribedAt: now,
      ...fields,
    })
    .onConflictDoUpdate({
      target: subscribers.email,
      set: fields,
      setWhere: and(
        sql`${subscribers.status} <> 'active'`,
        sql`(${subscribers.nextRequestAt} is null or ${subscribers.nextRequestAt} <= ${now})`
      ),
    })
    .returning({ id: subscribers.id })
  return {
    success: true,
    alreadySubscribed: !saved,
    confirmationToken: saved ? token : null,
  }
}
export async function confirmNewsletterSubscriber(
  token: string,
  database: DB = db
) {
  const [row] = await database
    .update(subscribers)
    .set({
      status: "active",
      confirmationHash: null,
      confirmationExpires: null,
    })
    .where(
      and(
        eq(subscribers.status, "pending"),
        eq(subscribers.confirmationHash, newsletterTokenHash(token)),
        sql`${subscribers.confirmationExpires} > ${new Date()}`
      )
    )
    .returning()
  return row || null
}
export async function unsubscribeNewsletterSubscriber(
  id: string,
  database: DB = db
) {
  await database
    .update(subscribers)
    .set({
      status: "unsubscribed",
      confirmationHash: null,
      confirmationExpires: null,
      nextRequestAt: new Date(Date.now() + 600000),
    })
    .where(eq(subscribers.id, id))
}
export async function removeNewsletterSubscriber(
  email: string,
  database: DB = db
) {
  await database
    .delete(subscribers)
    .where(eq(subscribers.email, email.trim().toLowerCase()))
  return true
}
export async function clearAllNewsletterSubscribers(database: DB = db) {
  await database.delete(subscribers)
}
