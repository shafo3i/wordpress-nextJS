"use server"
import { count, desc, eq } from "drizzle-orm"
import { db } from "@/db"
import {
  newsletterSubscribers,
  newsletterSubscriberPageSchema,
} from "@/db/schema/cms-newsletter"
import { verifyPluginAdministrator } from "@/lib/plugins/authorization"
export async function getSubscriberPage(page: number, locale = "") {
  await verifyPluginAdministrator()
  newsletterSubscriberPageSchema.parse({ page, locale })
  const condition = locale
    ? eq(newsletterSubscribers.locale, locale)
    : undefined
  try {
    const [items, totals] = await Promise.all([
      db
        .select({
          id: newsletterSubscribers.id,
          email: newsletterSubscribers.email,
          status: newsletterSubscribers.status,
          locale: newsletterSubscribers.locale,
          subscribedAt: newsletterSubscribers.subscribedAt,
        })
        .from(newsletterSubscribers)
        .where(condition)
        .orderBy(
          desc(newsletterSubscribers.subscribedAt),
          newsletterSubscribers.email
        )
        .limit(20)
        .offset((page - 1) * 20),
      db
        .select({ total: count() })
        .from(newsletterSubscribers)
        .where(condition),
    ])
    return {
      items: items.map((item) => ({
        ...item,
        subscribedAt: item.subscribedAt.toISOString(),
      })),
      total: totals[0].total,
      error: "",
    }
  } catch {
    return {
      items: [],
      total: 0,
      error: "admin.plugins.newsletter.migration_required",
    }
  }
}
