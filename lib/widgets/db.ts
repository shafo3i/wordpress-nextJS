import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { getActivePluginSlugs } from "@/lib/plugins/loader";

export * from "./types";
import {
  AvailableWidgetDescriptor,
  CORE_WIDGETS,
  PLUGIN_WIDGET_DEFINITIONS,
  WidgetArea,
  WidgetItem,
  createDefaultWidgetItem,
} from "./types";

export const DEFAULT_WIDGET_AREAS: WidgetArea[] = [
  {
    id: "sidebar_primary",
    title: "Main / Right Sidebar",
    description: "Appears on the right side of the homepage and single article pages.",
    items: [
      { id: "w-search", type: "search", title: "Search News" },
      { id: "w-recent", type: "recent_posts", title: "Recent Stories", count: 5 },
      { id: "w-newsletter", type: "plugin_newsletter", title: "Morning Dispatch", pluginSlug: "newsletter" },
      { id: "w-cats", type: "categories", title: "Explore Topics" },
      {
        id: "w-bio",
        type: "author_bio",
        title: "About the Newsroom",
        content: "Independent financial, investigative, and digital reporting operating with editorial integrity.",
      },
    ],
  },
  {
    id: "sidebar_secondary",
    title: "Left Sidebar (Dual Sidebar)",
    description: "Appears on the left side of the homepage when Dual Sidebar layout is selected.",
    items: [
      { id: "w-audio", type: "plugin_audio", title: "Newsroom Daily Audio", pluginSlug: "article-audio" },
      { id: "w-cats-left", type: "categories", title: "Quick Sections" },
      { id: "w-factcheck", type: "plugin_factcheck", title: "Claim Verification", pluginSlug: "fact-check" },
    ],
  },
  {
    id: "footer_1",
    title: "Footer Column 1",
    description: "First footer column across the site.",
    items: [
      {
        id: "w-foot-about",
        type: "custom_html",
        title: "About Signal News",
        content: "Delivering daily global news and independent investigative analysis since 2026.",
      },
    ],
  },
  {
    id: "footer_2",
    title: "Footer Column 2",
    description: "Second footer column across the site.",
    items: [
      { id: "w-foot-topics", type: "categories", title: "Quick Links" },
    ],
  },
  {
    id: "footer_3",
    title: "Footer Column 3",
    description: "Third footer column across the site.",
    items: [
      {
        id: "w-foot-ad",
        type: "custom_html",
        title: "Newsroom Mission",
        content: "Supported by subscriber contributions and independent enterprise readers.",
      },
    ],
  },
];

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
 * Retrieve all available widgets dynamically based on active plugins
 */
export async function getAvailableWidgets(): Promise<AvailableWidgetDescriptor[]> {
  const activeSlugs = await getActivePluginSlugs();
  const pluginWidgets: AvailableWidgetDescriptor[] = [];

  for (const slug of activeSlugs) {
    if (PLUGIN_WIDGET_DEFINITIONS[slug]) {
      pluginWidgets.push(PLUGIN_WIDGET_DEFINITIONS[slug]);
    }
  }

  return [...CORE_WIDGETS, ...pluginWidgets];
}


/**
 * Retrieve all widget areas from wp_options (sidebars_widgets).
 * Automatically ensures all active plugins have their widgets placed into the layout
 * so editors don't have to manually hunt for and add them each time a plugin is activated.
 */
export async function getAllWidgetAreas(): Promise<WidgetArea[]> {
  const activeSlugs = await getActivePluginSlugs();
  const raw = await getOption("sidebars_widgets", "");
  let areas: WidgetArea[] = DEFAULT_WIDGET_AREAS;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        areas = parsed;
      }
    } catch (e) {
      console.error("Failed to parse sidebars_widgets:", e);
    }
  }

  // Ensure sidebar_secondary exists in the list for dual-sidebar support
  const hasSecondary = areas.some((a) => a.id === "sidebar_secondary");
  if (!hasSecondary) {
    const defaultSecondary = DEFAULT_WIDGET_AREAS.find((a) => a.id === "sidebar_secondary")!;
    areas.splice(1, 0, defaultSecondary);
  }

  // Check which active plugins are not yet placed in ANY widget area
  const existingPluginSlugs = new Set<string>();
  for (const area of areas) {
    for (const item of area.items) {
      if (item.pluginSlug) {
        existingPluginSlugs.add(item.pluginSlug);
      }
    }
  }

  let modified = false;
  const primaryArea = areas.find((a) => a.id === "sidebar_primary") || areas[0];

  if (primaryArea) {
    for (const slug of activeSlugs) {
      if (!existingPluginSlugs.has(slug) && PLUGIN_WIDGET_DEFINITIONS[slug]) {
        const desc = PLUGIN_WIDGET_DEFINITIONS[slug];
        const newWidget = createDefaultWidgetItem(desc);
        primaryArea.items.push(newWidget);
        existingPluginSlugs.add(slug);
        modified = true;
      }
    }
  }

  if (modified) {
    await setOption("sidebars_widgets", JSON.stringify(areas));
  }

  return areas;
}

/**
 * Retrieve a specific widget area by ID
 */
export async function getWidgetArea(areaId: string): Promise<WidgetArea | null> {
  const areas = await getAllWidgetAreas();
  return areas.find((a) => a.id === areaId) || null;
}

/**
 * Save a widget area into wp_options
 */
export async function saveWidgetArea(areaId: string, items: WidgetItem[]): Promise<void> {
  const currentAreas = await getAllWidgetAreas();
  const updated = currentAreas.map((area) =>
    area.id === areaId ? { ...area, items } : area
  );

  await setOption("sidebars_widgets", JSON.stringify(updated));
}
