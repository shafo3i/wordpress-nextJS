import { retiredPlugins, pluginSlugSchema } from "@/db/schema/cms-plugins"
import { eq, sql } from "drizzle-orm"
import { DB, db } from "@/db"
import { wpOptions, pluginSlugsSchema } from "@/db/schema/cms-options"
import { AVAILABLE_PLUGINS } from "@/plugins/registry"
import type { PluginManifest } from "@/lib/plugins/types"

export const OPTION_ACTIVE_PLUGINS = "active_plugins"
export const OPTION_INSTALLED_PLUGINS = "installed_plugins"

const DEFAULT_INSTALLED = ["newsletter", "related-posts", "ad-manager"]
const DEFAULT_ACTIVE = ["newsletter"]

function normalizeSlug(entry: string): string {
  if (!entry) return ""
  return entry.split("/")[0].trim()
}

/**
 * Read option from wp_options
 */
export async function getOption(
  optionName: string,
  defaultValue = "",
  database: DB = db
): Promise<string> {
  const rows = await database
    .select({ value: wpOptions.optionValue })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, optionName))
    .limit(1)

  return rows[0]?.value ?? defaultValue
}

/**
 * Insert or update option in wp_options
 */
export async function updateOption(
  optionName: string,
  optionValue: string,
  autoload = "yes",
  database: DB = db
): Promise<void> {
  await database
    .insert(wpOptions)
    .values({ optionName, optionValue, autoload })
    .onConflictDoUpdate({
      target: wpOptions.optionName,
      set: { optionValue, autoload },
    })
}

/**
 * Retrieve installed plugin slugs from wp_options
 */
export async function getInstalledPluginSlugs(
  database: DB = db
): Promise<string[]> {
  try {
    const raw = await getOption(OPTION_INSTALLED_PLUGINS, "", database)
    if (!raw) return DEFAULT_INSTALLED

    const parsed = JSON.parse(raw)
    const validated = pluginSlugsSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data.map(normalizeSlug).filter(Boolean)
    }
    return DEFAULT_INSTALLED
  } catch (err) {
    console.error("Failed to read installed_plugins:", err)
    return DEFAULT_INSTALLED
  }
}

/**
 * Save installed plugin slugs into wp_options
 */
export async function setInstalledPluginSlugs(
  slugs: string[],
  database: DB = db
): Promise<void> {
  const uniqueSlugs = Array.from(
    new Set(slugs.map(normalizeSlug).filter(Boolean))
  )
  await updateOption(
    OPTION_INSTALLED_PLUGINS,
    JSON.stringify(uniqueSlugs),
    "yes",
    database
  )
}

/**
 * Retrieve active plugin slugs from wp_options
 */
export async function getActivePluginSlugs(
  database: DB = db
): Promise<string[]> {
  try {
    const raw = await getOption(OPTION_ACTIVE_PLUGINS, "", database)
    if (!raw) return DEFAULT_ACTIVE

    const parsed = JSON.parse(raw)
    const validated = pluginSlugsSchema.safeParse(parsed)
    if (validated.success) {
      return validated.data
        .map(normalizeSlug)
        .filter((slug) => !!slug && !retiredPlugins.has(slug))
    }
    return DEFAULT_ACTIVE
  } catch (err) {
    console.error("Failed to read active_plugins:", err)
    return DEFAULT_ACTIVE
  }
}

/**
 * Save active plugin slugs into wp_options
 */
export async function setActivePluginSlugs(
  slugs: string[],
  database: DB = db
): Promise<void> {
  const uniqueSlugs = Array.from(
    new Set(slugs.map(normalizeSlug).filter(Boolean))
  )
  await updateOption(
    OPTION_ACTIVE_PLUGINS,
    JSON.stringify(uniqueSlugs),
    "yes",
    database
  )
}

/**
 * Toggle plugin active status
 */
async function changePluginState(
  slugs: string[],
  action: "install" | "activate" | "deactivate" | "delete",
  database: DB
) {
  slugs.forEach((slug) => {
    pluginSlugSchema.parse(slug)
    if (
      (action === "install" || action === "activate") &&
      retiredPlugins.has(slug)
    )
      throw new Error("admin.plugins.retired")
  })
  await database.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('cms-plugin-state'))`
    )
    const connection = tx as unknown as DB
    const read = async (key: string, fallback: string[]) => {
      const raw = await getOption(key, "", connection)
      return raw
        ? pluginSlugsSchema.parse(JSON.parse(raw)).map(normalizeSlug)
        : fallback
    }
    let installed = await read(OPTION_INSTALLED_PLUGINS, DEFAULT_INSTALLED)
    let active = await read(OPTION_ACTIVE_PLUGINS, DEFAULT_ACTIVE)
    if (action === "install" || action === "activate")
      installed = [...new Set([...installed, ...slugs])]
    if (action === "activate") active = [...new Set([...active, ...slugs])]
    if (action === "delete")
      installed = installed.filter((slug) => !slugs.includes(slug))
    if (action === "delete" || action === "deactivate")
      active = active.filter((slug) => !slugs.includes(slug))
    active = active.filter(
      (slug) => !retiredPlugins.has(slug) && installed.includes(slug)
    )
    await setInstalledPluginSlugs(installed, connection)
    await setActivePluginSlugs(active, connection)
  })
}
export async function togglePlugin(
  slug: string,
  activate: boolean,
  database: DB = db
) {
  await changePluginState(
    [slug],
    activate ? "activate" : "deactivate",
    database
  )
}
export async function installPlugin(slug: string, database: DB = db) {
  await changePluginState([slug], "install", database)
}
export async function uninstallPlugin(slug: string, database: DB = db) {
  await changePluginState([slug], "delete", database)
}
export async function bulkUpdatePlugins(
  slugs: string[],
  action: "activate" | "deactivate" | "delete",
  database: DB = db
) {
  if (slugs.length) await changePluginState(slugs, action, database)
}

/**
 * Get all installed plugins with active status and optional filters
 */
export async function getAllPlugins(
  options: {
    status?: string
    search?: string
    page?: number
    limit?: number
  } = {},
  database: DB = db
): Promise<{ plugins: PluginManifest[]; total: number }> {
  const [installedSlugs, activeSlugs] = await Promise.all([
    getInstalledPluginSlugs(database),
    getActivePluginSlugs(database),
  ])

  const activeSet = new Set(activeSlugs)
  const allInstalled = installedSlugs
    .map((slug) => {
      const pluginModule = AVAILABLE_PLUGINS[slug]
      if (!pluginModule) return null
      return {
        ...pluginModule.manifest,
        isInstalled: true,
        isActive: activeSet.has(slug),
        settingsUrl: `/admincp/plugins/${slug}`,
      }
    })
    .filter(Boolean) as PluginManifest[]

  const search = options.search?.trim().toLowerCase() ?? ""
  const status = options.status ?? "all"

  const filtered = allInstalled.filter((plugin) => {
    if (status === "active" && !plugin.isActive) return false
    if (status === "inactive" && plugin.isActive) return false

    if (search) {
      const matchName = plugin.name.toLowerCase().includes(search)
      const matchDesc = plugin.description.toLowerCase().includes(search)
      const matchAuthor = plugin.author.toLowerCase().includes(search)
      return matchName || matchDesc || matchAuthor
    }
    return true
  })

  const total = filtered.length
  if (options.page && options.limit) {
    const offset = (options.page - 1) * options.limit
    return {
      plugins: filtered.slice(offset, offset + options.limit),
      total,
    }
  }

  return { plugins: filtered, total }
}

/**
 * Get summary counts of plugins for view tabs
 */
export async function getPluginCounts(
  database: DB = db
): Promise<{ all: number; active: number; inactive: number }> {
  const [installedSlugs, activeSlugs] = await Promise.all([
    getInstalledPluginSlugs(database),
    getActivePluginSlugs(database),
  ])

  const activeSet = new Set(activeSlugs)
  const total = installedSlugs.length
  const activeCount = installedSlugs.filter((s) => activeSet.has(s)).length
  const inactiveCount = total - activeCount

  return {
    all: total,
    active: activeCount,
    inactive: inactiveCount,
  }
}

/**
 * Get catalog plugins (for Add New directory)
 */
export async function getCatalogPlugins(
  options: {
    category?: string
    search?: string
  } = {},
  database: DB = db
): Promise<PluginManifest[]> {
  const [installedSlugs, activeSlugs] = await Promise.all([
    getInstalledPluginSlugs(database),
    getActivePluginSlugs(database),
  ])

  const installedSet = new Set(installedSlugs)
  const activeSet = new Set(activeSlugs)

  const catalog = Object.values(AVAILABLE_PLUGINS)
    .filter((pluginModule) => !retiredPlugins.has(pluginModule.manifest.slug))
    .map((pluginModule) => ({
      ...pluginModule.manifest,
      isInstalled: installedSet.has(pluginModule.manifest.slug),
      isActive: activeSet.has(pluginModule.manifest.slug),
    }))

  const search = options.search?.trim().toLowerCase() ?? ""
  const category = options.category

  return catalog.filter((plugin) => {
    if (
      !search &&
      category &&
      category !== "all" &&
      plugin.category !== category
    ) {
      return false
    }
    if (search) {
      const matchName = plugin.name.toLowerCase().includes(search)
      const matchDesc = plugin.description.toLowerCase().includes(search)
      const matchAuthor = plugin.author.toLowerCase().includes(search)
      return matchName || matchDesc || matchAuthor
    }
    return true
  })
}
