import { eq, inArray } from "drizzle-orm";
import { DB, db } from "@/db";
import { wpOptions } from "@/db/schema/cms-options";

export type SettingsMap = Record<string, string>;

export const DEFAULT_SETTINGS: SettingsMap = {
  // General
  blogname: "PressForge News",
  blogdescription: "The Independent News Journal",
  admin_email: "admin@pressforge.local",
  siteurl: "http://localhost:3000",
  home: "http://localhost:3000",
  default_role: "subscriber",
  timezone_string: "UTC",
  date_format: "F j, Y",
  time_format: "g:i a",

  // SEO & Indexing
  blog_public: "1", // 1 = visible to search engines, 0 = noindex
  seo_meta_title_template: "%title% — %sitename%",
  seo_default_meta_description: "Independent journalism covering breaking global events, politics, and technology.",
  seo_canonical_enabled: "1",
  seo_robots_extra: "max-image-preview:large",

  // Social & Open Graph
  og_default_image: "",
  og_site_name: "PressForge News",
  twitter_card_type: "summary_large_image",
  twitter_site_handle: "",
  facebook_app_id: "",

  // Analytics & Webmaster
  google_site_verification: "",
  bing_site_verification: "",
  google_analytics_id: "",
  custom_header_scripts: "",
  custom_footer_scripts: "",
};

/**
 * Retrieve a single option from wp_options with fallback.
 */
export async function getOption(
  name: string,
  fallback = "",
  database: DB = db
): Promise<string> {
  try {
    const [row] = await database
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, name))
      .limit(1);

    return row?.value ?? DEFAULT_SETTINGS[name] ?? fallback;
  } catch (err) {
    console.error(`Failed to get option ${name}:`, err);
    return DEFAULT_SETTINGS[name] ?? fallback;
  }
}

/**
 * Retrieve multiple options from wp_options at once.
 */
export async function getOptions(
  names: string[],
  database: DB = db
): Promise<SettingsMap> {
  if (!names.length) return {};

  try {
    const rows = await database
      .select({
        name: wpOptions.optionName,
        value: wpOptions.optionValue,
      })
      .from(wpOptions)
      .where(inArray(wpOptions.optionName, names));

    const result: SettingsMap = {};
    for (const name of names) {
      result[name] = DEFAULT_SETTINGS[name] ?? "";
    }
    for (const row of rows) {
      result[row.name] = row.value;
    }

    return result;
  } catch (err) {
    console.error("Failed to get options batch:", err);
    const fallbackMap: SettingsMap = {};
    for (const name of names) {
      fallbackMap[name] = DEFAULT_SETTINGS[name] ?? "";
    }
    return fallbackMap;
  }
}

/**
 * Sets or updates a single option in wp_options.
 */
export async function setOption(
  name: string,
  value: string,
  database: DB = db
): Promise<void> {
  const [existing] = await database
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, name))
    .limit(1);

  if (existing) {
    await database
      .update(wpOptions)
      .set({ optionValue: value })
      .where(eq(wpOptions.optionId, existing.id));
  } else {
    await database.insert(wpOptions).values({
      optionName: name,
      optionValue: value,
      autoload: "yes",
    });
  }
}

/**
 * Sets or updates multiple options in wp_options.
 */
export async function setOptions(
  entries: SettingsMap,
  database: DB = db
): Promise<void> {
  for (const [name, value] of Object.entries(entries)) {
    await setOption(name, value, database);
  }
}

/**
 * Retrieve all core CMS settings grouped for the settings dashboard.
 */
export async function getAllSettings(database: DB = db): Promise<SettingsMap> {
  const allKeys = Object.keys(DEFAULT_SETTINGS);
  return await getOptions(allKeys, database);
}
