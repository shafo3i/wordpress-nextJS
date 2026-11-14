import "server-only"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  widgetAreaIdSchema,
  widgetItemsSchema,
} from "@/db/schema/cms-appearance"
import { sanitizeWidgetItem } from "./security"
import { getActiveLanguages } from "@/services/language.service"
import { eq, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import { wpOptions } from "@/db/schema"
import { getActivePluginSlugs } from "@/lib/plugins/loader"
import { getAvailableWidgets as getRegistryAvailableWidgets } from "@/widgets/registry"
import type {
  AvailableWidgetDescriptor,
  WidgetArea,
  WidgetItem,
} from "@/widgets/types"

export * from "@/widgets/types"
export { createDefaultWidgetItem } from "@/widgets/registry"

export const DEFAULT_WIDGET_AREAS: WidgetArea[] = [
  "sidebar_primary",
  "sidebar_secondary",
  "sidebar_category",
  "footer_1",
  "footer_2",
  "footer_3",
  "footer_4",
].map((id) => ({ id, title: "", description: "", items: [] }))

async function getOption(
  name: string,
  fallback = "",
  database: DB = db
): Promise<string> {
  try {
    const row = await database
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, name))
      .limit(1)

    return row[0]?.value ?? fallback
  } catch {
    return fallback
  }
}

export async function getAvailableWidgets(): Promise<
  AvailableWidgetDescriptor[]
> {
  await verifyAdmin()
  const activeSlugs = await getActivePluginSlugs()
  return getRegistryAvailableWidgets(activeSlugs)
}

/**
 * Retrieve all widget areas from wp_options (sidebars_widgets).
 * Automatically ensures all active plugins have their widgets placed into the layout
 * so editors don't have to manually hunt for and add them each time a plugin is activated.
 */
export async function getAllWidgetAreas(
  database: DB = db,
  includeInactive = false
): Promise<WidgetArea[]> {
  const active = await getActivePluginSlugs()
  const raw = await getOption("sidebars_widgets", "", database)
  let stored: WidgetArea[] = []
  try {
    const parsed = JSON.parse(raw || "[]")
    if (Array.isArray(parsed)) stored = parsed.slice(0, 20)
  } catch {}
  return DEFAULT_WIDGET_AREAS.map((area) => {
    const source = stored.find((candidate) => candidate?.id === area.id)
    const items = Array.isArray(source?.items) ? source.items.slice(0, 50) : []
    const seen = new Set<string>()
    return {
      ...area,
      items: items.flatMap((rawItem) => {
        const item = sanitizeWidgetItem(rawItem)
        if (
          !item ||
          seen.has(item.id) ||
          (!includeInactive &&
            item.pluginSlug &&
            !active.includes(item.pluginSlug))
        )
          return []
        seen.add(item.id)
        return [item]
      }),
    }
  })
}

/**
 * Retrieve a specific widget area by ID
 */
export async function getWidgetArea(
  areaId: string
): Promise<WidgetArea | null> {
  const areas = await getAllWidgetAreas()
  return areas.find((a) => a.id === areaId) || null
}

/**
 * Save a widget area into wp_options
 */
export async function saveWidgetArea(
  areaId: string,
  raw: WidgetItem[],
  database: DB = db
): Promise<void> {
  await verifyAdmin()
  const id = widgetAreaIdSchema.parse(areaId)
  const inputs = widgetItemsSchema.parse(raw)
  const languages = await getActiveLanguages()
  const items = inputs.map((input) => {
    const item = sanitizeWidgetItem(input)
    if (
      !item ||
      (item.locale &&
        item.locale !== "all" &&
        !languages.some((language) => language.code === item.locale))
    )
      throw new Error("Invalid widget")
    return item
  })
  await database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('pressforge:widgets'))`
    )
    const areas = await getAllWidgetAreas(tx, true)
    const updated = areas.map((area) =>
      area.id === id ? { ...area, items } : area
    )
    const value = JSON.stringify(updated)
    await tx
      .insert(wpOptions)
      .values({
        optionName: "sidebars_widgets",
        optionValue: value,
        autoload: "yes",
      })
      .onConflictDoUpdate({
        target: wpOptions.optionName,
        set: { optionValue: value },
      })
  })
}
