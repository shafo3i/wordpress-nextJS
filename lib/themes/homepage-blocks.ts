import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { getActiveThemeSlug } from "./loader";
import {
  HomepageBlock,
  HomepageBlockType,
  HomepageLayout,
  HomepageSettings,
  getThemeDefaultSettings,
} from "./homepage-types";

export * from "./homepage-types";

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
      autoload: "yes",
    });
  }
}

/**
 * Retrieve full homepage settings (layout + blocks) for a theme from wp_options
 */
export async function getHomepageSettings(themeSlug?: string): Promise<HomepageSettings> {
  const slug = themeSlug || (await getActiveThemeSlug());
  const optionKey = `homepage_settings_${slug}`;

  // Check new compound settings first
  const raw = await getOption(optionKey, "");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
        return {
          layout: parsed.layout || "right_sidebar",
          blocks: parsed.blocks.sort((a: HomepageBlock, b: HomepageBlock) => a.order - b.order),
        };
      }
    } catch (e) {
      console.error(`Failed to parse ${optionKey}:`, e);
    }
  }

  // Fallback: Check legacy blocks key
  const legacyBlocksKey = `homepage_blocks_${slug}`;
  const legacyRaw = await getOption(legacyBlocksKey, "");
  if (legacyRaw) {
    try {
      const parsed = JSON.parse(legacyRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const legacyLayoutKey = `homepage_layout_${slug}`;
        const legacyLayout = (await getOption(legacyLayoutKey, "right_sidebar")) as HomepageLayout;
        return {
          layout: (["full_width", "right_sidebar", "left_sidebar", "dual_sidebar"].includes(legacyLayout)
            ? legacyLayout
            : "right_sidebar") as HomepageLayout,
          blocks: parsed.sort((a: HomepageBlock, b: HomepageBlock) => a.order - b.order),
        };
      }
    } catch {
      // Ignore
    }
  }

  // Return theme-tailored default
  return getThemeDefaultSettings(slug);
}

/**
 * Save full homepage settings (layout + blocks) for a theme into wp_options
 */
export async function saveHomepageSettings(
  themeSlug: string,
  settings: HomepageSettings
): Promise<void> {
  const optionKey = `homepage_settings_${themeSlug}`;
  const orderedBlocks = settings.blocks.map((b, idx) => ({ ...b, order: idx + 1 }));

  const payload: HomepageSettings = {
    layout: settings.layout,
    blocks: orderedBlocks,
  };

  await Promise.all([
    setOption(optionKey, JSON.stringify(payload)),
    // Also mirror to legacy keys for maximum backwards compatibility
    setOption(`homepage_blocks_${themeSlug}`, JSON.stringify(orderedBlocks)),
    setOption(`homepage_layout_${themeSlug}`, settings.layout),
  ]);
}

/**
 * Retrieve homepage blocks for a theme from wp_options (backwards-compatible wrapper)
 */
export async function getHomepageBlocks(themeSlug?: string): Promise<HomepageBlock[]> {
  const settings = await getHomepageSettings(themeSlug);
  return settings.blocks;
}

/**
 * Save homepage blocks for a theme in wp_options (backwards-compatible wrapper)
 */
export async function saveHomepageBlocks(
  themeSlug: string,
  blocks: HomepageBlock[]
): Promise<void> {
  const current = await getHomepageSettings(themeSlug);
  await saveHomepageSettings(themeSlug, {
    ...current,
    blocks,
  });
}
