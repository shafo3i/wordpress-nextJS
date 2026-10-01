import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";

export const PLUGIN_DEFAULTS: Record<string, Record<string, any>> = {
  newsletter: {
    brandName: "",
    pitch: "",
    buttonText: "",
    sendWelcomeEmail: true,
    welcomeSubject: "",
    welcomeMessage: "",
  },
  "breaking-news": {
    enabled: false,
    urgency: "urgent",
    badgeText: "",
    headline: "",
    targetUrl: "",
    enablePulse: true,
  },
  "article-audio": {
    audioUrl: "",
    stationName: "",
    episodeTitle: "",
    host: "",
    duration: "04:15",
    enableSpeechSynthesis: true,
  },
  "ad-manager": {
    enabled: true,
    sponsorName: "",
    imageUrl: "",
    targetUrl: "",
    customHtml: "",
    placement: "below_content",
  },
  "related-posts": {
    count: 3,
    matchStrategy: "categories",
    displayStyle: "list",
    showThumbnail: true,
    showDate: true,
  },
  "reading-time": {
    wpm: 200,
    position: "before_content",
    showMilestones: true,
    label: "",
  },
  "social-share": {
    networks: ["twitter", "facebook", "linkedin", "whatsapp", "copy"],
    style: "colored",
    sharePrompt: "",
  },
  "fact-check": {
    defaultRating: "verified",
    organization: "",
    summary: "",
  },
  "table-of-contents": {
    minHeadings: 2,
    levels: ["h2", "h3"],
    collapsible: true,
    title: "",
  },
};

/**
 * Retrieve configuration for a specific plugin from wp_options
 */
export async function getPluginConfig<T = Record<string, any>>(
  slug: string,
  defaults?: Partial<T>
): Promise<T> {
  const normalizedSlug = slug.replace(/_/g, "-");
  const optionKey = `plugin_config_${normalizedSlug}`;
  const defaultValues = {
    ...(PLUGIN_DEFAULTS[normalizedSlug] || {}),
    ...(defaults || {}),
  } as T;

  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, optionKey))
      .limit(1);

    if (row[0]?.value) {
      const parsed = JSON.parse(row[0].value);
      return { ...defaultValues, ...parsed };
    }
  } catch (err) {
    console.error(`Failed to load plugin config for ${slug}:`, err);
  }

  return defaultValues;
}

/**
 * Save configuration for a specific plugin into wp_options
 */
export async function savePluginConfig(slug: string, config: Record<string, any>): Promise<void> {
  const normalizedSlug = slug.replace(/_/g, "-");
  const optionKey = `plugin_config_${normalizedSlug}`;

  const current = await getPluginConfig(normalizedSlug);
  const updated = { ...current, ...config };
  const serialized = JSON.stringify(updated);

  const existing = await db
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, optionKey))
    .limit(1);

  if (existing.length) {
    await db
      .update(wpOptions)
      .set({ optionValue: serialized })
      .where(eq(wpOptions.optionId, existing[0].id));
  } else {
    await db.insert(wpOptions).values({
      optionName: optionKey,
      optionValue: serialized,
      autoload: "yes",
    });
  }
}
