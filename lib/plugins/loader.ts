import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { AVAILABLE_PLUGINS } from "@/plugins/registry";
import { clearAllHooks } from "./hooks";
import { PluginManifest } from "./types";

const OPTION_ACTIVE = "active_plugins";
const OPTION_INSTALLED = "installed_plugins";

const DEFAULT_INSTALLED = ["reading-time", "newsletter", "related-posts", "ad-manager"];
const DEFAULT_ACTIVE = ["reading-time", "newsletter"];

function normalizeSlug(entry: string): string {
  if (!entry) return "";
  return entry.split("/")[0].trim();
}

/**
 * Retrieve the list of installed plugin slugs stored in wp_options
 */
export async function getInstalledPluginSlugs(): Promise<string[]> {
  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, OPTION_INSTALLED))
      .limit(1);

    if (!row.length || !row[0].value) {
      return DEFAULT_INSTALLED;
    }

    const parsed = JSON.parse(row[0].value);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeSlug).filter(Boolean);
    }
    return DEFAULT_INSTALLED;
  } catch (err) {
    console.error("Failed to read installed_plugins from wp_options:", err);
    return DEFAULT_INSTALLED;
  }
}

/**
 * Save installed plugin slugs into wp_options
 */
export async function setInstalledPluginSlugs(slugs: string[]): Promise<void> {
  const uniqueSlugs = Array.from(new Set(slugs.map(normalizeSlug).filter(Boolean)));
  const serialized = JSON.stringify(uniqueSlugs);

  const existing = await db
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, OPTION_INSTALLED))
    .limit(1);

  if (existing.length) {
    await db
      .update(wpOptions)
      .set({ optionValue: serialized })
      .where(eq(wpOptions.optionId, existing[0].id));
  } else {
    await db.insert(wpOptions).values({
      optionName: OPTION_INSTALLED,
      optionValue: serialized,
      autoload: "yes",
    });
  }
}

/**
 * Install a new plugin from the catalog
 */
export async function installPlugin(slug: string): Promise<void> {
  const current = await getInstalledPluginSlugs();
  if (!current.includes(slug)) {
    await setInstalledPluginSlugs([...current, slug]);
  }
}

/**
 * Uninstall a plugin
 */
export async function uninstallPlugin(slug: string): Promise<void> {
  // First deactivate if active
  await togglePlugin(slug, false);

  const current = await getInstalledPluginSlugs();
  const updated = current.filter((s) => s !== slug);
  await setInstalledPluginSlugs(updated);
}

/**
 * Retrieve the list of active plugin slugs stored in wp_options
 */
export async function getActivePluginSlugs(): Promise<string[]> {
  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, OPTION_ACTIVE))
      .limit(1);

    if (!row.length || !row[0].value) {
      return DEFAULT_ACTIVE;
    }

    const parsed = JSON.parse(row[0].value);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeSlug).filter(Boolean);
    }
    return DEFAULT_ACTIVE;
  } catch (err) {
    console.error("Failed to read active_plugins from wp_options:", err);
    return DEFAULT_ACTIVE;
  }
}

/**
 * Save active plugin slugs into wp_options
 */
export async function setActivePluginSlugs(slugs: string[]): Promise<void> {
  const uniqueSlugs = Array.from(new Set(slugs.map(normalizeSlug).filter(Boolean)));
  const serialized = JSON.stringify(uniqueSlugs);

  const existing = await db
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, OPTION_ACTIVE))
    .limit(1);

  if (existing.length) {
    await db
      .update(wpOptions)
      .set({ optionValue: serialized })
      .where(eq(wpOptions.optionId, existing[0].id));
  } else {
    await db.insert(wpOptions).values({
      optionName: OPTION_ACTIVE,
      optionValue: serialized,
      autoload: "yes",
    });
  }
}

/**
 * Toggle a plugin active state
 */
export async function togglePlugin(slug: string, activate: boolean): Promise<void> {
  const activeSlugs = await getActivePluginSlugs();
  let updated: string[];

  if (activate) {
    // Ensure it is installed first
    await installPlugin(slug);
    updated = Array.from(new Set([...activeSlugs, slug]));
  } else {
    updated = activeSlugs.filter((s) => s !== slug);
  }

  await setActivePluginSlugs(updated);
}

/**
 * Get all installed plugins annotated with live active status
 */
export async function getAllPlugins(): Promise<PluginManifest[]> {
  const [installedSlugs, activeSlugs] = await Promise.all([
    getInstalledPluginSlugs(),
    getActivePluginSlugs(),
  ]);

  const activeSet = new Set(activeSlugs);

  return installedSlugs
    .map((slug) => {
      const module = AVAILABLE_PLUGINS[slug];
      if (!module) return null;
      return {
        ...module.manifest,
        isInstalled: true,
        isActive: activeSet.has(slug),
      };
    })
    .filter(Boolean) as PluginManifest[];
}

/**
 * Get catalog plugins (all plugins available in the repository) with installation status
 */
export async function getCatalogPlugins(): Promise<PluginManifest[]> {
  const [installedSlugs, activeSlugs] = await Promise.all([
    getInstalledPluginSlugs(),
    getActivePluginSlugs(),
  ]);

  const installedSet = new Set(installedSlugs);
  const activeSet = new Set(activeSlugs);

  return Object.values(AVAILABLE_PLUGINS).map((module) => {
    const slug = module.manifest.slug;
    return {
      ...module.manifest,
      isInstalled: installedSet.has(slug),
      isActive: activeSet.has(slug),
    };
  });
}

/**
 * Initialize all active plugins, binding their filters and actions
 */
export async function initActivePlugins(): Promise<void> {
  clearAllHooks();
  const activeSlugs = await getActivePluginSlugs();

  for (const slug of activeSlugs) {
    const plugin = AVAILABLE_PLUGINS[slug];
    if (plugin && typeof plugin.init === "function") {
      try {
        await plugin.init();
      } catch (err) {
        console.error(`[Plugins] Failed to initialize plugin '${slug}':`, err);
      }
    }
  }
}
