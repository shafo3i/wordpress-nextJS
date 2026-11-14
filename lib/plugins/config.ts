import "server-only"
import {
  pluginSlugSchema,
  pluginConfigSchemas,
  type PluginConfigMap,
} from "@/db/schema/cms-plugins"
import { sanitizePluginMarkup } from "./markup"
import { eq } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpOptions } from "@/db/schema"

export const PLUGIN_DEFAULTS: {
  [K in keyof PluginConfigMap]: PluginConfigMap[K]
} = {
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
    duration: "",
    enableSpeechSynthesis: false,
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
  "reading-time": {},
  "social-share": {},
  "fact-check": {
    defaultRating: "unreviewed",
    organization: "",
    summary: "",
  },
  "table-of-contents": {
    minHeadings: 2,
    levels: ["h2", "h3"],
    collapsible: true,
    title: "",
  },
}

/**
 * Retrieve configuration for a specific plugin from wp_options
 */
export async function getPluginConfig<S extends keyof PluginConfigMap>(
  slug: S,
  database: DB = db
): Promise<PluginConfigMap[S]> {
  const normalizedSlug = pluginSlugSchema.parse(slug.replace(/_/g, "-"))
  const optionKey = `plugin_config_${normalizedSlug}`
  const defaultValues = {
    ...(PLUGIN_DEFAULTS[normalizedSlug] || {}),
  } as PluginConfigMap[S]

  try {
    const row = await database
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, optionKey))
      .limit(1)

    if (row[0]?.value) {
      if (row[0].value.length > 1048576)
        throw new Error("Invalid stored configuration size")
      const parsed = JSON.parse(row[0].value)
      const candidate = { ...defaultValues, ...parsed }
      if (["reading-time", "social-share"].includes(normalizedSlug))
        return {} as PluginConfigMap[S]
      const valid = pluginConfigSchemas[normalizedSlug].safeParse(candidate)
      if (valid.success) return valid.data as PluginConfigMap[S]
      console.error(`Invalid stored configuration for ${normalizedSlug}`)
    }
  } catch (err) {
    console.error(`Failed to load plugin config for ${slug}:`, err)
  }

  return defaultValues
}

/**
 * Save configuration for a specific plugin into wp_options
 */
export async function savePluginConfig(
  slug: string,
  config: Record<string, unknown>
): Promise<void> {
  const { verifyPluginAdministrator } =
    await import("@/lib/plugins/authorization")
  await verifyPluginAdministrator()
  const normalizedSlug = pluginSlugSchema.parse(slug.replace(/_/g, "-"))
  const validated = pluginConfigSchemas[normalizedSlug].parse(config)
  const { sql } = await import("drizzle-orm")
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('cms-plugin-config'), hashtext(${normalizedSlug}))`
    )
    const current = await getPluginConfig(normalizedSlug, tx as unknown as DB)
    const updated: Record<string, unknown> = { ...current, ...validated }
    if (
      normalizedSlug === "ad-manager" &&
      typeof updated.customHtml === "string"
    )
      updated.customHtml = sanitizePluginMarkup(updated.customHtml)
    const serialized = JSON.stringify(updated)
    await tx
      .insert(wpOptions)
      .values({
        optionName: `plugin_config_${normalizedSlug}`,
        optionValue: serialized,
        autoload: "yes",
      })
      .onConflictDoUpdate({
        target: wpOptions.optionName,
        set: { optionValue: serialized },
      })
  })
}
