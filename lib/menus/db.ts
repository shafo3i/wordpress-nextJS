import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  wpOptions,
  wpPosts,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
} from "@/db/schema";
import { Menu, MenuItem } from "./types";

const NAV_MENU_LOCATIONS_OPTION = "nav_menu_locations";

/**
 * Get all menus registered in wp_terms + wp_term_taxonomy (taxonomy = 'nav_menu')
 */
export async function getAllMenus(): Promise<{ id: string; name: string; slug: string }[]> {
  const rows = await db
    .select({
      id: wpTermTaxonomy.termTaxonomyId,
      name: wpTerms.name,
      slug: wpTerms.slug,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
    .where(eq(wpTermTaxonomy.taxonomy, "nav_menu"))
    .orderBy(asc(wpTerms.name));

  return rows.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    slug: r.slug,
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
export async function getMenuWithItems(menuId: string): Promise<Menu | null> {
  const menuTaxonomyId = BigInt(menuId);

  const menuRow = await db
    .select({
      id: wpTermTaxonomy.termTaxonomyId,
      name: wpTerms.name,
      slug: wpTerms.slug,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
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
    }));
  }

  // Find which locations this menu is assigned to
  const allLocations = await getNavMenuLocations();
  const assignedLocations = Object.entries(allLocations)
    .filter(([_, id]) => id === menuId)
    .map(([loc]) => loc);

  return {
    id: menuId,
    name: menuRow[0].name,
    slug: menuRow[0].slug,
    items,
    locations: assignedLocations,
  };
}

/**
 * Create a new nav menu
 */
export async function createMenu(name: string): Promise<string> {
  const trimmed = name.trim();
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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

  return taxonomy.id.toString();
}

/**
 * Delete a nav menu and its menu items
 */
export async function deleteMenu(menuId: string): Promise<void> {
  const menuTaxonomyId = BigInt(menuId);

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
    await db.delete(wpTerms).where(eq(wpTerms.termId, tax[0].termId));
  }

  // 5. Clean from locations
  const locations = await getNavMenuLocations();
  let updatedLocations = false;
  for (const [key, val] of Object.entries(locations)) {
    if (val === menuId) {
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
  menuId: string,
  menuName: string,
  items: { id?: string; title: string; url: string; order: number }[],
  locations: string[]
): Promise<void> {
  const menuTaxonomyId = BigInt(menuId);

  // Update Menu Term name
  const taxRow = await db
    .select({ termId: wpTermTaxonomy.termId })
    .from(wpTermTaxonomy)
    .where(eq(wpTermTaxonomy.termTaxonomyId, menuTaxonomyId))
    .limit(1);

  if (taxRow.length) {
    await db
      .update(wpTerms)
      .set({ name: menuName.trim() })
      .where(eq(wpTerms.termId, taxRow[0].termId));
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
      const pId = BigInt(item.id);
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
    const toDeleteBigInt = toDelete.map((id) => BigInt(id));
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
  const currentLocations = await getNavMenuLocations();
  // Clear any locations currently pointing to this menu
  for (const [key, val] of Object.entries(currentLocations)) {
    if (val === menuId) {
      delete currentLocations[key];
    }
  }
  // Assign new locations
  for (const loc of locations) {
    currentLocations[loc] = menuId;
  }
  await setNavMenuLocations(currentLocations);
}

/**
 * Get list of published pages for the menu accordion
 */
export async function getPublishedPagesForMenu(): Promise<{ id: string; title: string; slug: string }[]> {
  const rows = await db
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      slug: wpPosts.postName,
    })
    .from(wpPosts)
    .where(
      and(
        eq(wpPosts.postType, "page"),
        eq(wpPosts.postStatus, "publish")
      )
    )
    .orderBy(asc(wpPosts.postTitle));

  return rows.map((r) => ({
    id: r.id.toString(),
    title: r.title,
    slug: r.slug,
  }));
}

/**
 * Get list of categories for the menu accordion
 */
export async function getCategoriesForMenu(): Promise<{ id: string; name: string; slug: string }[]> {
  const rows = await db
    .select({
      id: wpTermTaxonomy.termTaxonomyId,
      name: wpTerms.name,
      slug: wpTerms.slug,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
    .where(eq(wpTermTaxonomy.taxonomy, "category"))
    .orderBy(asc(wpTerms.name));

  return rows.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    slug: r.slug,
  }));
}
