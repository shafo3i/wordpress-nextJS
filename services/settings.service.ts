import "server-only";
import { eq, inArray } from "drizzle-orm";
import { DB, db } from "@/db";
import { wpOptions } from "@/db/schema/cms-options";
import { encryptValue } from "@/lib/encryption";
import { cache } from "react";
import { localizedSiteOptions } from "@/lib/site-identity";
import { buildSiteMetadata } from "@/lib/seo/metadata";

const SEO_OPTION_NAMES = [
  "site_identity_translations",
  "timezone_string",
  "google_site_verification",
  "bing_site_verification",
  "google_analytics_id",
  "blogname",
  "blogdescription",
  "home",
  "siteurl",
  "show_on_front",
  "page_on_front",
  "blog_public",
  "seo_meta_title_template",
  "seo_default_meta_description",
  "seo_canonical_enabled",
  "seo_robots_extra",
  "og_default_image",
  "og_site_name",
  "twitter_card_type",
  "twitter_site_handle",
  "facebook_app_id",
];
export const getSiteSeoOptions = cache(() => getOptions(SEO_OPTION_NAMES));

export type SettingsMap = Record<string, string>;

export const DEFAULT_SETTINGS: SettingsMap = {
  // General
  site_identity_translations: "{}",
  email_template_translations: "{}",
  blogname: "PressForge News",
  blogdescription: "The Independent News Journal",
  admin_email: "admin@pressforge.local",
  siteurl: "http://localhost:3000",
  home: "http://localhost:3000",
  default_role: "subscriber",
  users_can_register: "1",
  disableSignUp: "false",
  timezone_string: "UTC",
  date_format: "F j, Y",
  time_format: "g:i a",
  show_on_front: "posts",
  page_on_front: "",

  // SEO & Indexing
  blog_public: "1", // 1 = visible to search engines, 0 = noindex
  seo_meta_title_template: "%title% — %sitename%",
  seo_default_meta_description:
    "Independent journalism covering breaking global events, politics, and technology.",
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

  // SMTP & Mail Server
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from_email: "",
  smtp_from_name: "",
  smtp_secure: "tls",

  // Email Notifications & Features
  admin_notification_email: "",
  enable_new_post_notifications: "0",
  enable_newsletter_notifications: "0",

  // Email Templates Wording (Configured in UI)
  email_new_post_subject: "📰 New Story: {{postTitle}}",
  email_new_post_heading: "New Article Published",
  email_welcome_subject: "",
  email_welcome_heading: "",
  email_welcome_body: "",
  email_footer_text: "",
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
  database: Pick<DB, "select" | "insert" | "update"> = db
): Promise<void> {
  const finalValue =
    name === "smtp_pass" && value ? encryptValue(value) : value;

  const [existing] = await database
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, name))
    .limit(1);

  if (existing) {
    await database
      .update(wpOptions)
      .set({ optionValue: finalValue })
      .where(eq(wpOptions.optionId, existing.id));
  } else {
    await database.insert(wpOptions).values({
      optionName: name,
      optionValue: finalValue,
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
  await database.transaction(async (transaction) => {
    for (const [name, value] of Object.entries(entries)) {
      await setOption(name, value, transaction);
    }
  });
}

/**
 * Retrieve all core CMS settings grouped for the settings dashboard.
 */
export async function getAllSettings(database: DB = db): Promise<SettingsMap> {
  const { verifyAdmin } = await import("@/lib/authMIddleware");
  await verifyAdmin();
  const allKeys = Object.keys(DEFAULT_SETTINGS);
  return await getOptions(allKeys, database);
}

/**
 * Resolves standard Next.js Metadata for the site from wp_options
 */
export async function getSiteMetadata(database: DB = db) {
  const options =
    database === db
      ? await getSiteSeoOptions()
      : await getOptions(SEO_OPTION_NAMES, database);
  const { getPublicLanguageContext } = await import("@/lib/public-language");
  const language = await getPublicLanguageContext();
  return buildSiteMetadata(
    localizedSiteOptions(options, language.code, language.defaultCode)
  );
}

/** Validated admin-only boundary; generic option helpers serve other CMS modules. */
export async function saveAdminSettings(entries: unknown): Promise<void> {
  const { verifyAdmin } = await import("@/lib/authMIddleware");
  await verifyAdmin();
  const { settingsPatchSchema } = await import("@/db/schema/cms-settings");
  const values = settingsPatchSchema.parse(entries);
  // Signup flags represent one setting; do not leave contradictory legacy values.
  if (values.users_can_register !== undefined)
    values.disableSignUp = values.users_can_register === "1" ? "false" : "true";
  else if (values.disableSignUp !== undefined)
    values.users_can_register = ["true", "1"].includes(values.disableSignUp)
      ? "0"
      : "1";
  await db.transaction(async (tx) => {
    if (values.page_on_front && values.page_on_front !== "0") {
      const { wpPosts } = await import("@/db/schema/cms-posts");
      const { and } = await import("drizzle-orm");
      const [page] = await tx
        .select({ id: wpPosts.id })
        .from(wpPosts)
        .where(
          and(
            eq(wpPosts.id, BigInt(values.page_on_front)),
            eq(wpPosts.postType, "page")
          )
        )
        .limit(1);
      if (!page) throw new Error("Invalid front page");
    }
    for (const [name, value] of Object.entries(values))
      await setOption(name, value, tx);
  });
}

/** Shared database quota across instances, keyed by the authenticated administrator. */
export async function reserveSettingsTestEmail(): Promise<void> {
  const { verifyAdmin } = await import("@/lib/authMIddleware");
  const session = await verifyAdmin();
  const { rateLimit } = await import("@/db/schema/auth-schema");
  const { sql } = await import("drizzle-orm");
  const { randomUUID } = await import("node:crypto");
  const now = Date.now(),
    cutoff = now - 60000;
  const [row] = await db
    .insert(rateLimit)
    .values({
      id: randomUUID(),
      key: `cms-settings-test-email:${session.user.id}`,
      count: 1,
      lastRequest: now,
    })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${rateLimit.lastRequest} <= ${cutoff} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: sql`case when ${rateLimit.lastRequest} <= ${cutoff} then ${now} else ${rateLimit.lastRequest} end`,
      },
    })
    .returning({ count: rateLimit.count });
  if (!row || Number(row.count) > 3)
    throw new Error("Test email quota exceeded");
}
