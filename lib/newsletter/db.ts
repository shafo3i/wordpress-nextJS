import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
  source?: string;
  status: "active" | "unsubscribed";
}

const OPTION_KEY = "newsletter_subscribers";

async function getOption(name: string, fallback = ""): Promise<string> {
  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, name))
      .limit(1);

    return row[0]?.value ?? fallback;
  } catch {
    return fallback;
  }
}

async function setOption(name: string, value: string): Promise<void> {
  const existing = await db
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, name))
    .limit(1);

  if (existing.length) {
    await db
      .update(wpOptions)
      .set({ optionValue: value })
      .where(eq(wpOptions.optionId, existing[0].id));
  } else {
    await db.insert(wpOptions).values({
      optionName: name,
      optionValue: value,
      autoload: "no",
    });
  }
}

/**
 * Retrieve all registered newsletter subscribers
 */
export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    const raw = await getOption(OPTION_KEY, "[]");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Failed to read newsletter subscribers:", err);
    return [];
  }
}

/**
 * Add or update a subscriber in the newsletter database
 */
export async function addNewsletterSubscriber(
  email: string,
  options?: { name?: string; source?: string }
): Promise<{ success: boolean; alreadySubscribed: boolean; subscriber: NewsletterSubscriber }> {
  const normalized = email.trim().toLowerCase();
  const current = await getNewsletterSubscribers();

  const existing = current.find((s) => s.email.toLowerCase() === normalized);
  if (existing) {
    if (existing.status === "unsubscribed") {
      existing.status = "active";
      existing.subscribedAt = new Date().toISOString();
      await setOption(OPTION_KEY, JSON.stringify(current));
    }
    return { success: true, alreadySubscribed: true, subscriber: existing };
  }

  const newSubscriber: NewsletterSubscriber = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: normalized,
    name: options?.name?.trim() || undefined,
    subscribedAt: new Date().toISOString(),
    source: options?.source || "website_form",
    status: "active",
  };

  current.unshift(newSubscriber);
  await setOption(OPTION_KEY, JSON.stringify(current));

  return { success: true, alreadySubscribed: false, subscriber: newSubscriber };
}

/**
 * Remove / unsubscribe an email
 */
export async function removeNewsletterSubscriber(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const current = await getNewsletterSubscribers();
  const filtered = current.filter((s) => s.email.toLowerCase() !== normalized);
  await setOption(OPTION_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Clear all subscribers
 */
export async function clearAllNewsletterSubscribers(): Promise<void> {
  await setOption(OPTION_KEY, JSON.stringify([]));
}
