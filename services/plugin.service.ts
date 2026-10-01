import { eq } from "drizzle-orm";
import { DB, db } from "@/db";
import {
  wpOptions,
  pluginSlugsSchema,
  type PluginSlugs,
} from "@/db/schema/cms-options";
import { AVAILABLE_PLUGINS } from "@/plugins/registry";
import type { PluginManifest } from "@/lib/plugins/types";

export const OPTION_ACTIVE_PLUGINS = "active_plugins";
export const OPTION_INSTALLED_PLUGINS = "installed_plugins";

const DEFAULT_INSTALLED = ["reading-time", "newsletter", "related-posts", "ad-manager"];
const DEFAULT_ACTIVE = ["reading-time", "newsletter"];

function normalizeSlug(entry: string): string {
  if (!entry) return "";
  return entry.split("/")[0].trim();
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
    .limit(1);

  return rows[0]?.value ?? defaultValue;
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
  const existing = await database
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, optionName))
    .limit(1);

  if (existing.length) {
    await database
      .update(wpOptions)
      .set({ optionValue, autoload })
      .where(eq(wpOptions.optionId, existing[0].id));
  } else {
    await database.insert(wpOptions).values({
      optionName,
      optionValue,
      autoload,
    });
  }
}

/**
 * Retrieve installed plugin slugs from wp_options
 */
export async function getInstalledPluginSlugs(database: DB = db): Promise<string[]> {
  try {
    const raw = await getOption(OPTION_INSTALLED_PLUGINS, "", database);
    if (!raw) return DEFAULT_INSTALLED;

    const parsed = JSON.parse(raw);
    const validated = pluginSlugsSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data.map(normalizeSlug).filter(Boolean);
    }
    return DEFAULT_INSTALLED;
  } catch (err) {
    console.error("Failed to read installed_plugins:", err);
    return DEFAULT_INSTALLED;
  }
}

/**
 * Save installed plugin slugs into wp_options
 */
export async function setInstalledPluginSlugs(
  slugs: string[],
  database: DB = db
): Promise<void> {
  const uniqueSlugs = Array.from(new Set(slugs.map(normalizeSlug).filter(Boolean)));
  await updateOption(OPTION_INSTALLED_PLUGINS, JSON.stringify(uniqueSlugs), "yes", database);
}

/**
 * Retrieve active plugin slugs from wp_options
 */
export async function getActivePluginSlugs(database: DB = db): Promise<string[]> {
  try {
    const raw = await getOption(OPTION_ACTIVE_PLUGINS, "", database);
    if (!raw) return DEFAULT_ACTIVE;

    const parsed = JSON.parse(raw);
    const validated = pluginSlugsSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data.map(normalizeSlug).filter(Boolean);
    }
    return DEFAULT_ACTIVE;
  } catch (err) {
    console.error("Failed to read active_plugins:", err);
    return DEFAULT_ACTIVE;
  }
}

/**
 * Save active plugin slugs into wp_options
 */
export async function setActivePluginSlugs(
  slugs: string[],
  database: DB = db
): Promise<void> {
  const uniqueSlugs = Array.from(new Set(slugs.map(normalizeSlug).filter(Boolean)));
  await updateOption(OPTION_ACTIVE_PLUGINS, JSON.stringify(uniqueSlugs), "yes", database);
}

/**
 * Toggle plugin active status
 */
export async function togglePlugin(
  slug: string,
  activate: boolean,
  database: DB = db
): Promise<void> {
  const activeSlugs = await getActivePluginSlugs(database);

  if (activate) {
    // Ensure plugin is installed first
    const installed = await getInstalledPluginSlugs(database);
    if (!installed.includes(slug)) {
      await setInstalledPluginSlugs([...installed, slug], database);
    }
    const updated = Array.from(new Set([...activeSlugs, slug]));
    await setActivePluginSlugs(updated, database);
  } else {
    const updated = activeSlugs.filter((s) => s !== slug);
    await setActivePluginSlugs(updated, database);
  }
}

/**
 * Install plugin
 */
export async function installPlugin(slug: string, database: DB = db): Promise<void> {
  const current = await getInstalledPluginSlugs(database);
  if (!current.includes(slug)) {
    await setInstalledPluginSlugs([...current, slug], database);
  }
}

/**
 * Uninstall plugin
 */
export async function uninstallPlugin(slug: string, database: DB = db): Promise<void> {
  await togglePlugin(slug, false, database);
  const current = await getInstalledPluginSlugs(database);
  const updated = current.filter((s) => s !== slug);
  await setInstalledPluginSlugs(updated, database);
}

/**
 * Bulk action on plugins
 */
export async function bulkUpdatePlugins(
  slugs: string[],
  action: "activate" | "deactivate" | "delete",
  database: DB = db
): Promise<void> {
  if (!slugs.length) return;

  if (action === "delete") {
    for (const slug of slugs) {
      await uninstallPlugin(slug, database);
    }
  } else if (action === "activate") {
    const currentActive = await getActivePluginSlugs(database);
    const updated = Array.from(new Set([...currentActive, ...slugs]));
    await setActivePluginSlugs(updated, database);
  } else if (action === "deactivate") {
    const currentActive = await getActivePluginSlugs(database);
    const toDeactivate = new Set(slugs);
    const updated = currentActive.filter((s) => !toDeactivate.has(s));
    await setActivePluginSlugs(updated, database);
  }
}

/**
 * Get all installed plugins with active status and optional filters
 */
export async function getAllPlugins(
  options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
  database: DB = db
): Promise<{ plugins: PluginManifest[]; total: number }> {
  const [installedSlugs, activeSlugs] = await Promise.all([
    getInstalledPluginSlugs(database),
    getActivePluginSlugs(database),
  ]);

  const activeSet = new Set(activeSlugs);
  const allInstalled = installedSlugs
    .map((slug) => {
      const module = AVAILABLE_PLUGINS[slug];
      if (!module) return null;
      return {
        ...module.manifest,
        isInstalled: true,
        isActive: activeSet.has(slug),
        settingsUrl: `/admincp/plugins/${slug}`,
      };
    })
    .filter(Boolean) as PluginManifest[];

  const search = options.search?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";

  const filtered = allInstalled.filter((plugin) => {
    if (status === "active" && !plugin.isActive) return false;
    if (status === "inactive" && plugin.isActive) return false;

    if (search) {
      const matchName = plugin.name.toLowerCase().includes(search);
      const matchDesc = plugin.description.toLowerCase().includes(search);
      const matchAuthor = plugin.author.toLowerCase().includes(search);
      return matchName || matchDesc || matchAuthor;
    }
    return true;
  });

  const total = filtered.length;
  if (options.page && options.limit) {
    const offset = (options.page - 1) * options.limit;
    return {
      plugins: filtered.slice(offset, offset + options.limit),
      total,
    };
  }

  return { plugins: filtered, total };
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
  ]);

  const activeSet = new Set(activeSlugs);
  const total = installedSlugs.length;
  const activeCount = installedSlugs.filter((s) => activeSet.has(s)).length;
  const inactiveCount = total - activeCount;

  return {
    all: total,
    active: activeCount,
    inactive: inactiveCount,
  };
}

/**
 * Get catalog plugins (for Add New directory)
 */
export async function getCatalogPlugins(
  options: {
    category?: string;
    search?: string;
  } = {},
  database: DB = db
): Promise<PluginManifest[]> {
  const [installedSlugs, activeSlugs] = await Promise.all([
    getInstalledPluginSlugs(database),
    getActivePluginSlugs(database),
  ]);

  const installedSet = new Set(installedSlugs);
  const activeSet = new Set(activeSlugs);

  const catalog = Object.values(AVAILABLE_PLUGINS).map((module) => ({
    ...module.manifest,
    isInstalled: installedSet.has(module.manifest.slug),
    isActive: activeSet.has(module.manifest.slug),
  }));

  const search = options.search?.trim().toLowerCase() ?? "";
  const category = options.category;

  return catalog.filter((plugin) => {
    if (!search && category && category !== "all" && plugin.category !== category) {
      return false;
    }
    if (search) {
      const matchName = plugin.name.toLowerCase().includes(search);
      const matchDesc = plugin.description.toLowerCase().includes(search);
      const matchAuthor = plugin.author.toLowerCase().includes(search);
      return matchName || matchDesc || matchAuthor;
    }
    return true;
  });
}
