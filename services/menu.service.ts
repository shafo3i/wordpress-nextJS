import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  wpOptions,
  wpPosts,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
  wpTermmeta,
} from "@/db/schema";
import { postTranslationsTable } from "@/db/schema/cms-languages";
import { Menu, MenuItem, MenuLocation } from "@/lib/menus/types";

export type { Menu, MenuItem, MenuLocation };

const NAV_MENU_LOCATIONS_OPTION = "nav_menu_locations";

export interface MenuItemInput {
  id?: string;
  title: string;
  url: string;
  order: number;
  target?: string;
  type?: "page" | "category" | "custom" | "post";
}

export interface SaveMenuInput {
  name: string;
  items: MenuItemInput[];
  locations: string[];
  language?: string;
}

export interface CreateMenuInput {
  name: string;
  slug?: string;
  language?: string;
}

export interface GetMenusOptions {
  language?: string;
}

/**
 * Convert value to BigInt safely
 */
export function toBigInt(val: unknown): bigint {
  if (val === null || val === undefined || val === "") return BigInt(0);
  if (typeof val === "bigint") return val;
  if (typeof val === "number" || typeof val === "string") return BigInt(val);
  return BigInt(0);
}

/**
 * Get all menus registered in wp_terms + wp_term_taxonomy (taxonomy = 'nav_menu')
 */
export async function getAllMenus(options: GetMenusOptions = {}): Promise<{ id: string; name: string; slug: string; language?: string }[]> {
  const { language } = options;

  let query = db
    .select({
      id: wpTermTaxonomy.termTaxonomyId,
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      metaLanguage: wpTermmeta.metaValue,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
    .leftJoin(
      wpTermmeta,
      and(
        eq(wpTermmeta.termId, wpTerms.termId),
        eq(wpTermmeta.metaKey, "language")
      )
    )
    .where(eq(wpTermTaxonomy.taxonomy, "nav_menu"))
    .orderBy(asc(wpTerms.name));

  const rows = await query;

  let filtered = rows;
  if (language && language !== "all") {
    filtered = rows.filter((r) => r.metaLanguage === language || !r.metaLanguage);
  }

  return filtered.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    slug: r.slug,
    language: r.metaLanguage || undefined,
  }));
}

/**
 * Get location mapping from wp_options (e.g. { "primary": "14", "footer": "15" })
 */
export async function getNavMenuLocations(): Promise<Record<string, string>> {
  try {
    const row = await db
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, NAV_MENU_LOCATIONS_OPTION))
      .limit(1);

    if (!row.length || !row[0].value) return {};
    const parsed = JSON.parse(row[0].value);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (err) {
    console.error("Failed to read nav_menu_locations:", err);
    return {};
  }
}

/**
 * Save location mapping into wp_options
 */
export async function setNavMenuLocations(locations: Record<string, string>): Promise<void> {
  const serialized = JSON.stringify(locations);

  const existing = await db
    .select({ id: wpOptions.optionId })
    .from(wpOptions)
    .where(eq(wpOptions.optionName, NAV_MENU_LOCATIONS_OPTION))
    .limit(1);

  if (existing.length) {
    await db
      .update(wpOptions)
      .set({ optionValue: serialized })
      .where(eq(wpOptions.optionId, existing[0].id));
  } else {
    await db.insert(wpOptions).values({
      optionName: NAV_MENU_LOCATIONS_OPTION,
      optionValue: serialized,
      autoload: "yes",
    });
  }
}

/**
 * Get a specific menu with all its menu items and assigned locations
 */
export async function getMenuById(menuId: string | number | bigint): Promise<Menu | null> {
  const menuTaxonomyId = toBigInt(menuId);
  if (menuTaxonomyId <= BigInt(0)) return null;

  const menuRow = await db
    .select({
      id: wpTermTaxonomy.termTaxonomyId,
      termId: wpTerms.termId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      metaLanguage: wpTermmeta.metaValue,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
    .leftJoin(
      wpTermmeta,
      and(
        eq(wpTermmeta.termId, wpTerms.termId),
        eq(wpTermmeta.metaKey, "language")
      )
    )
    .where(
      and(
        eq(wpTermTaxonomy.termTaxonomyId, menuTaxonomyId),
        eq(wpTermTaxonomy.taxonomy, "nav_menu")
      )
    )
    .limit(1);

  if (!menuRow.length) return null;

  // Query menu item post IDs linked to this menu term
  const relationships = await db
    .select({ objectId: wpTermRelationships.objectId })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, menuTaxonomyId));

  const itemPostIds = relationships.map((r) => r.objectId);

  let items: MenuItem[] = [];
  if (itemPostIds.length > 0) {
    const postRows = await db
      .select({
        id: wpPosts.id,
        title: wpPosts.postTitle,
        url: wpPosts.guid,
        order: wpPosts.menuOrder,
      })
      .from(wpPosts)
      .where(
        and(
          inArray(wpPosts.id, itemPostIds),
          eq(wpPosts.postType, "nav_menu_item")
        )
      )
      .orderBy(asc(wpPosts.menuOrder));

    items = postRows.map((p) => ({
      id: p.id.toString(),
      title: p.title,
      url: p.url,
      order: p.order ?? 0,
      type: p.url.startsWith("/category/")
        ? "category"
        : p.url.startsWith("http://") || p.url.startsWith("https://")
          ? "custom"
          : "page",
    }));
  }

  // Find which locations this menu is assigned to
  const allLocations = await getNavMenuLocations();
  const stringMenuId = menuId.toString();
  const assignedLocations = Object.entries(allLocations)
    .filter(([_, id]) => id === stringMenuId)
    .map(([loc]) => loc);

  return {
    id: stringMenuId,
    name: menuRow[0].name,
    slug: menuRow[0].slug,
    language: menuRow[0].metaLanguage || undefined,
    items,
    locations: assignedLocations,
  };
}

/**
 * Backward compatibility alias for getMenuById
 */
export const getMenuWithItems = getMenuById;

/**
 * Create a new nav menu
 */
export async function createMenu(
  input: string | CreateMenuInput
): Promise<string> {
  const name = typeof input === "string" ? input : input.name;
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Menu name is required.");
  }

  const explicitSlug = typeof input === "object" ? input.slug : undefined;
  const slug =
    explicitSlug?.trim() ||
    trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") ||
    `menu-${Date.now()}`;

  const language = typeof input === "object" ? input.language : undefined;

  const [term] = await db
    .insert(wpTerms)
    .values({ name: trimmed, slug })
    .returning({ id: wpTerms.termId });

  const [taxonomy] = await db
    .insert(wpTermTaxonomy)
    .values({
      termId: term.id,
      taxonomy: "nav_menu",
      count: BigInt(0),
    })
    .returning({ id: wpTermTaxonomy.termTaxonomyId });

  if (language && language !== "all") {
    await db.insert(wpTermmeta).values({
      termId: term.id,
      metaKey: "language",
      metaValue: language,
    });
  }

  return taxonomy.id.toString();
}

/**
 * Delete a nav menu and its menu items
 */
export async function deleteMenu(menuId: string | number | bigint): Promise<void> {
  const menuTaxonomyId = toBigInt(menuId);
  if (menuTaxonomyId <= BigInt(0)) return;

  // 1. Get menu items to delete
  const relationships = await db
    .select({ objectId: wpTermRelationships.objectId })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, menuTaxonomyId));

  const postIds = relationships.map((r) => r.objectId);

  // 2. Remove relationships
  await db
    .delete(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, menuTaxonomyId));

  // 3. Delete nav_menu_item posts
  if (postIds.length > 0) {
    await db
      .delete(wpPosts)
      .where(
        and(
          inArray(wpPosts.id, postIds),
          eq(wpPosts.postType, "nav_menu_item")
        )
      );
  }

  // 4. Delete taxonomy and term
  const tax = await db
    .select({ termId: wpTermTaxonomy.termId })
    .from(wpTermTaxonomy)
    .where(eq(wpTermTaxonomy.termTaxonomyId, menuTaxonomyId))
    .limit(1);

  await db
    .delete(wpTermTaxonomy)
    .where(eq(wpTermTaxonomy.termTaxonomyId, menuTaxonomyId));

  if (tax.length) {
    await db.delete(wpTermmeta).where(eq(wpTermmeta.termId, tax[0].termId));
    await db.delete(wpTerms).where(eq(wpTerms.termId, tax[0].termId));
  }

  // 5. Clean from locations
  const locations = await getNavMenuLocations();
  let updatedLocations = false;
  const stringMenuId = menuId.toString();
  for (const [key, val] of Object.entries(locations)) {
    if (val === stringMenuId) {
      delete locations[key];
      updatedLocations = true;
    }
  }
  if (updatedLocations) {
    await setNavMenuLocations(locations);
  }
}

/**
 * Save menu structure, items, and assigned locations
 */
export async function saveMenu(
  menuId: string | number | bigint,
  menuName: string,
  items: MenuItemInput[],
  locations: string[],
  language?: string
): Promise<void> {
  const menuTaxonomyId = toBigInt(menuId);
  const trimmedName = menuName.trim();
  if (!trimmedName) {
    throw new Error("Menu name is required.");
  }

  // Update Menu Term name
  const taxRow = await db
    .select({ termId: wpTermTaxonomy.termId })
    .from(wpTermTaxonomy)
    .where(eq(wpTermTaxonomy.termTaxonomyId, menuTaxonomyId))
    .limit(1);

  if (taxRow.length) {
    await db
      .update(wpTerms)
      .set({ name: trimmedName })
      .where(eq(wpTerms.termId, taxRow[0].termId));

    if (language !== undefined) {
      const existingLangMeta = await db
        .select({ metaId: wpTermmeta.metaId })
        .from(wpTermmeta)
        .where(
          and(
            eq(wpTermmeta.termId, taxRow[0].termId),
            eq(wpTermmeta.metaKey, "language")
          )
        )
        .limit(1);

      if (language && language !== "all") {
        if (existingLangMeta.length > 0) {
          await db
            .update(wpTermmeta)
            .set({ metaValue: language })
            .where(eq(wpTermmeta.metaId, existingLangMeta[0].metaId));
        } else {
          await db.insert(wpTermmeta).values({
            termId: taxRow[0].termId,
            metaKey: "language",
            metaValue: language,
          });
        }
      } else if (existingLangMeta.length > 0) {
        await db
          .delete(wpTermmeta)
          .where(eq(wpTermmeta.metaId, existingLangMeta[0].metaId));
      }
    }
  }

  // Get current item IDs
  const oldRel = await db
    .select({ objectId: wpTermRelationships.objectId })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, menuTaxonomyId));
  const oldItemIds = oldRel.map((r) => r.objectId.toString());

  const retainedItemIds = new Set<string>();
  const date = new Date();

  for (const item of items) {
    if (item.id && !item.id.startsWith("temp-") && oldItemIds.includes(item.id)) {
      // Update existing item
      const pId = toBigInt(item.id);
      await db
        .update(wpPosts)
        .set({
          postTitle: item.title,
          guid: item.url,
          menuOrder: item.order,
        })
        .where(eq(wpPosts.id, pId));
      retainedItemIds.add(item.id);
    } else {
      // Create new nav_menu_item post
      const [newPost] = await db
        .insert(wpPosts)
        .values({
          postDate: date,
          postDateGmt: date,
          postContent: "",
          postTitle: item.title,
          postExcerpt: "",
          postStatus: "publish",
          commentStatus: "closed",
          pingStatus: "closed",
          postName: `menu-item-${Date.now()}-${item.order}`,
          guid: item.url,
          menuOrder: item.order,
          postType: "nav_menu_item",
          commentCount: BigInt(0),
        })
        .returning({ id: wpPosts.id });

      await db.insert(wpTermRelationships).values({
        objectId: newPost.id,
        termTaxonomyId: menuTaxonomyId,
        termOrder: 0,
      });

      retainedItemIds.add(newPost.id.toString());
    }
  }

  // Delete removed items
  const toDelete = oldItemIds.filter((id) => !retainedItemIds.has(id));
  if (toDelete.length > 0) {
    const toDeleteBigInt = toDelete.map((id) => toBigInt(id));
    await db
      .delete(wpTermRelationships)
      .where(
        and(
          inArray(wpTermRelationships.objectId, toDeleteBigInt),
          eq(wpTermRelationships.termTaxonomyId, menuTaxonomyId)
        )
      );

    await db
      .delete(wpPosts)
      .where(
        and(
          inArray(wpPosts.id, toDeleteBigInt),
          eq(wpPosts.postType, "nav_menu_item")
        )
      );
  }

  // Update locations mapping
  const stringMenuId = menuId.toString();
  const currentLocations = await getNavMenuLocations();
  for (const [key, val] of Object.entries(currentLocations)) {
    if (val === stringMenuId) {
      delete currentLocations[key];
    }
  }
  for (const loc of locations) {
    currentLocations[loc] = stringMenuId;
    if ((loc === "primary_en" || loc === "primary_ar") && !currentLocations["primary"]) {
      currentLocations["primary"] = stringMenuId;
    }
    if ((loc === "footer_en" || loc === "footer_ar") && !currentLocations["footer"]) {
      currentLocations["footer"] = stringMenuId;
    }
  }
  await setNavMenuLocations(currentLocations);
}

/**
 * Get list of published pages for the menu accordion
 */
export async function getPublishedPagesForMenu(options: { language?: string } = {}): Promise<
  { id: string; title: string; slug: string; language?: string }[]
> {
  const { language } = options;

  let query = db
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      slug: wpPosts.postName,
      languageCode: postTranslationsTable.languageCode,
    })
    .from(wpPosts)
    .leftJoin(postTranslationsTable, eq(wpPosts.id, postTranslationsTable.postId))
    .where(
      and(
        eq(wpPosts.postType, "page"),
        eq(wpPosts.postStatus, "publish")
      )
    )
    .orderBy(asc(wpPosts.postTitle));

  const rows = await query;

  let filtered = rows;
  if (language && language !== "all") {
    const matched = rows.filter((r) => {
      if (language === "en") {
        return r.languageCode === "en" || !r.languageCode;
      }
      return r.languageCode === language;
    });
    if (matched.length > 0) {
      filtered = matched;
    }
  }

  return filtered.map((r) => ({
    id: r.id.toString(),
    title: r.title,
    slug: r.slug,
    language: r.languageCode || undefined,
  }));
}

/**
 * Get list of categories for the menu accordion
 */
export async function getCategoriesForMenu(options: { language?: string } = {}): Promise<
  { id: string; name: string; slug: string; language?: string }[]
> {
  const { language } = options;

  let query = db
    .select({
      id: wpTermTaxonomy.termTaxonomyId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      metaLanguage: wpTermmeta.metaValue,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
    .leftJoin(
      wpTermmeta,
      and(
        eq(wpTermmeta.termId, wpTerms.termId),
        eq(wpTermmeta.metaKey, "language")
      )
    )
    .where(eq(wpTermTaxonomy.taxonomy, "category"))
    .orderBy(asc(wpTerms.name));

  const rows = await query;

  let filtered = rows;
  if (language && language !== "all") {
    const matched = rows.filter((r) => {
      if (language === "en") {
        return r.metaLanguage === "en" || !r.metaLanguage;
      }
      return r.metaLanguage === language;
    });
    if (matched.length > 0) {
      filtered = matched;
    }
  }

  return filtered.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    slug: r.slug,
    language: r.metaLanguage || undefined,
  }));
}

/**
 * Get list of published posts for the menu accordion
 */
export async function getPublishedPostsForMenu(options: { language?: string; limit?: number } = {}): Promise<
  { id: string; title: string; slug: string; language?: string }[]
> {
  const { language, limit = 20 } = options;

  let query = db
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      slug: wpPosts.postName,
      languageCode: postTranslationsTable.languageCode,
    })
    .from(wpPosts)
    .leftJoin(postTranslationsTable, eq(wpPosts.id, postTranslationsTable.postId))
    .where(
      and(
        eq(wpPosts.postType, "post"),
        eq(wpPosts.postStatus, "publish")
      )
    )
    .orderBy(asc(wpPosts.postTitle))
    .limit(limit);

  const rows = await query;

  let filtered = rows;
  if (language && language !== "all") {
    const matched = rows.filter((r) => {
      if (language === "en") {
        return r.languageCode === "en" || !r.languageCode;
      }
      return r.languageCode === language;
    });
    if (matched.length > 0) {
      filtered = matched;
    }
  }

  return filtered.map((r) => ({
    id: r.id.toString(),
    title: r.title,
    slug: r.slug,
    language: r.languageCode || undefined,
  }));
}

export const menuService = {
  getAllMenus,
  getMenuById,
  getMenuWithItems,
  getNavMenuLocations,
  setNavMenuLocations,
  createMenu,
  deleteMenu,
  saveMenu,
  getPublishedPagesForMenu,
  getCategoriesForMenu,
  getPublishedPostsForMenu,
};
