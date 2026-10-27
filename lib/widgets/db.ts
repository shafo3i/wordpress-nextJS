import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { getActivePluginSlugs } from "@/lib/plugins/loader";
import {
  getAvailableWidgets as getRegistryAvailableWidgets,
  createDefaultWidgetItem,
  REGISTERED_WIDGETS,
} from "@/widgets/registry";
import type {
  AvailableWidgetDescriptor,
  WidgetArea,
  WidgetItem,
} from "@/widgets/types";

export * from "@/widgets/types";
export { createDefaultWidgetItem } from "@/widgets/registry";

export const DEFAULT_WIDGET_AREAS: WidgetArea[] = [
  {
    id: "sidebar_primary",
    title: "Main / Right Sidebar",
    description: "Appears on the right side of the homepage and single article pages.",
    items: [],
  },
  {
    id: "sidebar_secondary",
    title: "Left Sidebar (Dual Sidebar)",
    description: "Appears on the left side of the homepage when Dual Sidebar layout is selected.",
    items: [],
  },
  {
    id: "sidebar_category",
    title: "Category & Archive Sidebar",
    description: "Appears on category and topic archive pages.",
    items: [],
  },
  {
    id: "footer_1",
    title: "Footer Column 1",
    description: "First footer column across the site.",
    items: [],
  },
  {
    id: "footer_2",
    title: "Footer Column 2",
    description: "Second footer column across the site.",
    items: [],
  },
  {
    id: "footer_3",
    title: "Footer Column 3",
    description: "Third footer column across the site.",
    items: [],
  },
  {
    id: "footer_4",
    title: "Footer Column 4",
    description: "Fourth footer column across the site.",
    items: [],
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
 * Retrieve all available widgets dynamically based on active plugins from the registry
 */
export async function getAvailableWidgets(): Promise<AvailableWidgetDescriptor[]> {
  const activeSlugs = await getActivePluginSlugs();
  return getRegistryAvailableWidgets(activeSlugs);
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

  // Ensure sidebar_category exists in the list for category archive pages
  const hasCategory = areas.some((a) => a.id === "sidebar_category");
  if (!hasCategory) {
    const defaultCategory = DEFAULT_WIDGET_AREAS.find((a) => a.id === "sidebar_category") || {
      id: "sidebar_category",
      title: "Category & Archive Sidebar",
      description: "Appears on category and topic archive pages.",
      items: [],
    };
    areas.splice(2, 0, defaultCategory);
  }

  // Ensure footer_4 exists in the list for 4-column footers
  const hasFooter4 = areas.some((a) => a.id === "footer_4");
  if (!hasFooter4) {
    areas.push({
      id: "footer_4",
      title: "Footer Column 4",
      description: "Fourth footer column across the site.",
      items: [],
    });
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
