import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { getActiveThemeSlug } from "./loader";
import { getHomepageLayoutSettings } from "./homepage-layout";
import {
  HomepageBlock,
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
      if (parsed && typeof parsed === "object") {
        const layout = (["full_width", "right_sidebar", "left_sidebar", "dual_sidebar"].includes(parsed.layout)
          ? parsed.layout
          : "right_sidebar") as HomepageLayout;
        const blocks = Array.isArray(parsed.blocks)
          ? parsed.blocks.sort((a: HomepageBlock, b: HomepageBlock) => a.order - b.order)
          : [];
        return {
          ...getHomepageLayoutSettings(parsed),
          layout,
          blocks,
          sections: parsed.sections,
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
 * Retrieve homepage blocks for a theme from wp_options (backwards-compatible wrapper)
 */
export async function getHomepageBlocks(themeSlug?: string): Promise<HomepageBlock[]> {
  const settings = await getHomepageSettings(themeSlug);
  return settings.blocks;
}
