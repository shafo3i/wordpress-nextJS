import { eq, inArray } from "drizzle-orm";
import { DB, db } from "@/db";
import { wpOptions } from "@/db/schema/cms-options";
import { encryptValue } from "@/lib/encryption";

export type SettingsMap = Record<string, string>;

export const DEFAULT_SETTINGS: SettingsMap = {
  // General
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
  email_welcome_subject: "🎉 Welcome to {{siteName}}",
  email_welcome_heading: "Welcome to Our Newsletter",
  email_welcome_body: "Thank you for subscribing to our newsletter. You will receive our top editorial dispatches and stories directly in your inbox.",
  email_footer_text: "You received this email because you subscribed to updates.",
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
  const finalValue = name === "smtp_pass" && value ? encryptValue(value) : value;

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

/**
 * Resolves standard Next.js Metadata for the site from wp_options
 */
export async function getSiteMetadata(database: DB = db): Promise<any> {
  const options = await getOptions(
    [
      "blogname",
      "blogdescription",
      "og_default_image",
      "og_site_name",
      "twitter_card_type",
      "twitter_site_handle",
      "facebook_app_id",
    ],
    database
  );

  const siteName = options.blogname || "PressForge News";
  const description = options.blogdescription || "";
  const ogSiteName = options.og_site_name || siteName;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const ogImage = options.og_default_image
    ? options.og_default_image.startsWith("http")
      ? options.og_default_image
      : `${siteUrl}${options.og_default_image}`
    : `${siteUrl}/opengraph-image`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    openGraph: {
      siteName: ogSiteName,
      title: siteName,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
      type: "website",
    },
    twitter: {
      card: options.twitter_card_type || "summary_large_image",
      site: options.twitter_site_handle || undefined,
      title: siteName,
      description,
      images: [ogImage],
    },
    other: options.facebook_app_id ? { "fb:app_id": options.facebook_app_id } : {},
  };
}
