import "server-only"
import { randomUUID } from "node:crypto"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  createMenuSchema,
  saveMenuSchema,
  menuIdSchema,
  menuLocationsSchema,
  menuQuerySchema,
  appearanceUrlSchema,
} from "@/db/schema/cms-appearance"
import { getActiveLanguages } from "@/services/language.service"
import { and, asc, eq, inArray, lte, sql } from "drizzle-orm"
import { db, type DB } from "@/db"
import {
  wpOptions,
  wpPosts,
  wpTermRelationships,
  wpTermTaxonomy,
  wpTerms,
  wpTermmeta,
} from "@/db/schema"
import {
  postTranslationsTable,
  termTranslationsTable,
} from "@/db/schema/cms-languages"
import { Menu, MenuItem, MenuLocation } from "@/lib/menus/types"

export type { Menu, MenuItem, MenuLocation }

const NAV_MENU_LOCATIONS_OPTION = "nav_menu_locations"

export interface MenuItemInput {
  id?: string
  title: string
  url: string
  order: number
  target?: string
  type?: "page" | "category" | "custom" | "post"
}

export interface SaveMenuInput {
  name: string
  items: MenuItemInput[]
  locations: string[]
  language?: string
}

export interface CreateMenuInput {
  name: string
  slug?: string
  language?: string
}

export interface GetMenusOptions {
  language?: string
}

/**
 * Convert value to BigInt safely
 */
export function toBigInt(val: unknown): bigint {
  return menuIdSchema.parse(val)
}

/**
 * Get all menus registered in wp_terms + wp_term_taxonomy (taxonomy = 'nav_menu')
 */
export async function getAllMenus(
  options: GetMenusOptions = {},
  database: DB = db
): Promise<{ id: string; name: string; slug: string; language?: string }[]> {
  await verifyAdmin()
  const { language } = menuQuerySchema.parse(options)

  const query = database
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
    .orderBy(asc(wpTerms.name))

  const rows = await query

  let filtered = rows
  if (language && language !== "all") {
    filtered = rows.filter(
      (r) => r.metaLanguage === language || !r.metaLanguage
    )
  }

  return filtered.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    slug: r.slug,
    language: r.metaLanguage || undefined,
  }))
}

/**
 * Get location mapping from wp_options (e.g. { "primary": "14", "footer": "15" })
 */
export async function getNavMenuLocations(
  database: DB = db
): Promise<Record<string, string>> {
  try {
    const row = await database
      .select({ value: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, NAV_MENU_LOCATIONS_OPTION))
      .limit(1)

    if (!row.length || !row[0].value) return {}
    const parsed = JSON.parse(row[0].value)
    const result = menuLocationsSchema.safeParse(parsed)
    return result.success ? result.data : {}
  } catch (err) {
    void err
    return {}
  }
}

/**
 * Save location mapping into wp_options
 */
async function writeLocations(locations: Record<string, string>, database: DB) {
  await database
    .insert(wpOptions)
    .values({
      optionName: NAV_MENU_LOCATIONS_OPTION,
      optionValue: JSON.stringify(locations),
      autoload: "yes",
    })
    .onConflictDoUpdate({
      target: wpOptions.optionName,
      set: { optionValue: JSON.stringify(locations) },
    })
}
export async function setNavMenuLocations(
  raw: Record<string, string>,
  database: DB = db
): Promise<void> {
  await verifyAdmin()
  const locations = menuLocationsSchema.parse(raw)
  await database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await lockMenus(tx)
    for (const id of new Set(Object.values(locations)))
      await requireMenu(BigInt(id), tx)
    await validateMenuLanguage(undefined, Object.keys(locations))
    await writeLocations(locations, tx)
  })
}

/**
 * Get a specific menu with all its menu items and assigned locations
 */
export async function getMenuById(
  menuId: string | number | bigint,
  database: DB = db
): Promise<Menu | null> {
  const parsedId = menuIdSchema.safeParse(menuId)
  if (!parsedId.success) return null
  const menuTaxonomyId = parsedId.data

  const menuRow = await database
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
    .limit(1)

  if (!menuRow.length) return null

  // Query menu item post IDs linked to this menu term
  const relationships = await database
    .select({ objectId: wpTermRelationships.objectId })
    .from(wpTermRelationships)
    .where(eq(wpTermRelationships.termTaxonomyId, menuTaxonomyId))

  const itemPostIds = relationships.map((r) => r.objectId)

  let items: MenuItem[] = []
  if (itemPostIds.length > 0) {
    const postRows = await database
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
      .orderBy(asc(wpPosts.menuOrder))

    items = postRows
      .filter((p) => appearanceUrlSchema.safeParse(p.url).success)
      .map((p) => ({
        id: p.id.toString(),
        title: p.title,
        url: p.url,
        order: p.order ?? 0,
        type: p.url.startsWith("/category/")
          ? "category"
          : p.url.startsWith("http://") || p.url.startsWith("https://")
            ? "custom"
            : "page",
      }))
  }

  // Find which locations this menu is assigned to
  const allLocations = await getNavMenuLocations(database)
  const stringMenuId = menuId.toString()
  const assignedLocations = Object.entries(allLocations)
    .filter((entry) => entry[1] === stringMenuId)
    .map(([loc]) => loc)

  return {
    id: stringMenuId,
    name: menuRow[0].name,
    slug: menuRow[0].slug,
    language: menuRow[0].metaLanguage || undefined,
    items,
    locations: assignedLocations,
  }
}

/**
 * Backward compatibility alias for getMenuById
 */
export const getMenuWithItems = getMenuById

/**
 * Create a new nav menu
 */
export class MenuMutationError extends Error {}
async function lockMenus(database: DB) {
  await database.execute(
    sql`select pg_advisory_xact_lock(hashtext('pressforge:menus'))`
  )
}
async function requireMenu(id: bigint, database: DB) {
  const [menu] = await database
    .select({ termId: wpTermTaxonomy.termId })
    .from(wpTermTaxonomy)
    .where(
      and(
        eq(wpTermTaxonomy.termTaxonomyId, id),
        eq(wpTermTaxonomy.taxonomy, "nav_menu")
      )
    )
    .for("update")
  if (!menu) throw new MenuMutationError("Invalid menu")
  return menu
}
async function validateMenuLanguage(
  language?: string,
  locations: string[] = []
) {
  const codes = (await getActiveLanguages()).map((locale) => locale.code)
  if (language && language !== "all" && !codes.includes(language))
    throw new MenuMutationError("Invalid language")
  if (
    locations.some(
      (location) =>
        location.includes("_") &&
        !codes.includes(location.slice(location.indexOf("_") + 1))
    )
  )
    throw new MenuMutationError("Invalid location")
}
async function ownedItems(id: bigint, database: DB) {
  const rows = await database
    .select({ id: wpPosts.id, type: wpPosts.postType })
    .from(wpTermRelationships)
    .innerJoin(wpPosts, eq(wpPosts.id, wpTermRelationships.objectId))
    .where(eq(wpTermRelationships.termTaxonomyId, id))
  if (rows.some((row) => row.type !== "nav_menu_item"))
    throw new MenuMutationError("Invalid menu items")
  const ids = rows.map((row) => row.id)
  if (ids.length) {
    const links = await database
      .select({ menuId: wpTermRelationships.termTaxonomyId })
      .from(wpTermRelationships)
      .where(inArray(wpTermRelationships.objectId, ids))
    if (links.some((link) => link.menuId !== id))
      throw new MenuMutationError("Shared menu items cannot be mutated")
  }
  return ids
}
export async function createMenu(
  raw: string | CreateMenuInput,
  database: DB = db
): Promise<string> {
  await verifyAdmin()
  const input = createMenuSchema.parse(
    typeof raw === "string" ? { name: raw } : raw
  )
  await validateMenuLanguage(input.language)
  return database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await lockMenus(tx)
    const slug =
      input.slug ||
      `${input.name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 160)}-${randomUUID()}`
    const [term] = await tx
      .insert(wpTerms)
      .values({ name: input.name, slug })
      .returning({ id: wpTerms.termId })
    const [taxonomy] = await tx
      .insert(wpTermTaxonomy)
      .values({ termId: term.id, taxonomy: "nav_menu", count: BigInt(0) })
      .returning({ id: wpTermTaxonomy.termTaxonomyId })
    if (input.language && input.language !== "all")
      await tx
        .insert(wpTermmeta)
        .values({
          termId: term.id,
          metaKey: "language",
          metaValue: input.language,
        })
    return taxonomy.id.toString()
  })
}
export async function deleteMenu(
  raw: string | number | bigint,
  database: DB = db
): Promise<void> {
  await verifyAdmin()
  const id = menuIdSchema.parse(raw)
  await database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await lockMenus(tx)
    const menu = await requireMenu(id, tx)
    const ids = await ownedItems(id, tx)
    await tx
      .delete(wpTermRelationships)
      .where(eq(wpTermRelationships.termTaxonomyId, id))
    if (ids.length)
      await tx
        .delete(wpPosts)
        .where(
          and(inArray(wpPosts.id, ids), eq(wpPosts.postType, "nav_menu_item"))
        )
    await tx
      .delete(wpTermTaxonomy)
      .where(
        and(
          eq(wpTermTaxonomy.termTaxonomyId, id),
          eq(wpTermTaxonomy.taxonomy, "nav_menu")
        )
      )
    const others = await tx
      .select({ id: wpTermTaxonomy.termTaxonomyId })
      .from(wpTermTaxonomy)
      .where(eq(wpTermTaxonomy.termId, menu.termId))
      .limit(1)
    if (!others.length) {
      await tx.delete(wpTermmeta).where(eq(wpTermmeta.termId, menu.termId))
      await tx.delete(wpTerms).where(eq(wpTerms.termId, menu.termId))
    }
    const locations = await getNavMenuLocations(tx)
    for (const [key, value] of Object.entries(locations))
      if (value === id.toString()) delete locations[key]
    await writeLocations(locations, tx)
  })
}
export async function saveMenu(
  rawId: string | number | bigint,
  name: string,
  items: MenuItemInput[],
  locations: string[],
  language?: string,
  database: DB = db
): Promise<void> {
  const session = await verifyAdmin()
  const input = saveMenuSchema.parse({
    menuId: rawId,
    name,
    items,
    locations,
    language,
  })
  await validateMenuLanguage(input.language, input.locations)
  await database.transaction(async (transaction) => {
    const tx = transaction as unknown as DB
    await lockMenus(tx)
    const menu = await requireMenu(input.menuId, tx)
    const oldIds = await ownedItems(input.menuId, tx)
    if (
      input.items.some(
        (item) =>
          item.id &&
          !item.id.startsWith("temp-") &&
          !oldIds.includes(BigInt(item.id))
      )
    )
      throw new MenuMutationError("Invalid item owner")
    await tx
      .update(wpTerms)
      .set({ name: input.name })
      .where(eq(wpTerms.termId, menu.termId))
    if (input.language !== undefined) {
      await tx
        .delete(wpTermmeta)
        .where(
          and(
            eq(wpTermmeta.termId, menu.termId),
            eq(wpTermmeta.metaKey, "language")
          )
        )
      if (input.language && input.language !== "all")
        await tx
          .insert(wpTermmeta)
          .values({
            termId: menu.termId,
            metaKey: "language",
            metaValue: input.language,
          })
    }
    const retained = new Set<bigint>()
    for (const [order, item] of input.items.entries()) {
      if (item.id && !item.id.startsWith("temp-")) {
        const id = BigInt(item.id)
        retained.add(id)
        await tx
          .update(wpPosts)
          .set({ postTitle: item.title, guid: item.url, menuOrder: order })
          .where(and(eq(wpPosts.id, id), eq(wpPosts.postType, "nav_menu_item")))
      } else {
        const [post] = await tx
          .insert(wpPosts)
          .values({
            postAuthor: session.user.id,
            postTitle: item.title,
            guid: item.url,
            menuOrder: order,
            postType: "nav_menu_item",
            postStatus: "publish",
            commentStatus: "closed",
            pingStatus: "closed",
            postName: randomUUID(),
          })
          .returning({ id: wpPosts.id })
        await tx
          .insert(wpTermRelationships)
          .values({
            objectId: post.id,
            termTaxonomyId: input.menuId,
            termOrder: order,
          })
        retained.add(post.id)
      }
    }
    const removed = oldIds.filter((id) => !retained.has(id))
    if (removed.length) {
      await tx
        .delete(wpTermRelationships)
        .where(
          and(
            eq(wpTermRelationships.termTaxonomyId, input.menuId),
            inArray(wpTermRelationships.objectId, removed)
          )
        )
      await tx
        .delete(wpPosts)
        .where(
          and(
            inArray(wpPosts.id, removed),
            eq(wpPosts.postType, "nav_menu_item")
          )
        )
    }
    const current = await getNavMenuLocations(tx)
    for (const [key, value] of Object.entries(current))
      if (value === input.menuId.toString()) delete current[key]
    for (const location of input.locations)
      current[location] = input.menuId.toString()
    await writeLocations(current, tx)
  })
}

/**
 * Get list of published pages for the menu accordion
 */
export async function getPublishedPagesForMenu(
  options: { language?: string } = {},
  database: DB = db
): Promise<{ id: string; title: string; slug: string; language?: string }[]> {
  await verifyAdmin()
  const { language } = menuQuerySchema.parse(options)

  const query = database
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      slug: wpPosts.postName,
      languageCode: postTranslationsTable.languageCode,
    })
    .from(wpPosts)
    .leftJoin(
      postTranslationsTable,
      eq(wpPosts.id, postTranslationsTable.postId)
    )
    .where(
      and(
        eq(wpPosts.postType, "page"),
        eq(wpPosts.postStatus, "publish"),
        eq(wpPosts.postPassword, ""),
        lte(wpPosts.postDateGmt, new Date()),
        language && language !== "all"
          ? eq(postTranslationsTable.languageCode, language)
          : undefined
      )
    )
    .orderBy(asc(wpPosts.postTitle))

  const rows = await query

  let filtered = rows
  if (language && language !== "all") {
    const matched = rows.filter((r) => {
      return r.languageCode === language
    })
    filtered = matched
  }

  return filtered.map((r) => ({
    id: r.id.toString(),
    title: r.title,
    slug: r.slug,
    language: r.languageCode || undefined,
  }))
}

/**
 * Get list of categories for the menu accordion
 */
export async function getCategoriesForMenu(
  options: { language?: string } = {},
  database: DB = db
): Promise<{ id: string; name: string; slug: string; language?: string }[]> {
  await verifyAdmin()
  const { language } = menuQuerySchema.parse(options)

  const query = database
    .select({
      id: wpTermTaxonomy.termTaxonomyId,
      name: wpTerms.name,
      slug: wpTerms.slug,
      metaLanguage: termTranslationsTable.languageCode,
    })
    .from(wpTermTaxonomy)
    .innerJoin(wpTerms, eq(wpTermTaxonomy.termId, wpTerms.termId))
    .leftJoin(
      termTranslationsTable,
      eq(termTranslationsTable.termTaxonomyId, wpTermTaxonomy.termTaxonomyId)
    )
    .where(eq(wpTermTaxonomy.taxonomy, "category"))
    .orderBy(asc(wpTerms.name))

  const rows = await query

  let filtered = rows
  if (language && language !== "all") {
    const matched = rows.filter((r) => {
      return r.metaLanguage === language
    })
    filtered = matched
  }

  return filtered.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    slug: r.slug,
    language: r.metaLanguage || undefined,
  }))
}

/**
 * Get list of published posts for the menu accordion
 */
export async function getPublishedPostsForMenu(
  options: { language?: string; limit?: number } = {},
  database: DB = db
): Promise<{ id: string; title: string; slug: string; language?: string }[]> {
  await verifyAdmin()
  const { language, limit } = menuQuerySchema.parse(options)

  const query = database
    .select({
      id: wpPosts.id,
      title: wpPosts.postTitle,
      slug: wpPosts.postName,
      languageCode: postTranslationsTable.languageCode,
    })
    .from(wpPosts)
    .leftJoin(
      postTranslationsTable,
      eq(wpPosts.id, postTranslationsTable.postId)
    )
    .where(
      and(
        eq(wpPosts.postType, "post"),
        eq(wpPosts.postStatus, "publish"),
        eq(wpPosts.postPassword, ""),
        lte(wpPosts.postDateGmt, new Date()),
        language && language !== "all"
          ? eq(postTranslationsTable.languageCode, language)
          : undefined
      )
    )
    .orderBy(asc(wpPosts.postTitle))
    .limit(limit)

  const rows = await query

  let filtered = rows
  if (language && language !== "all") {
    const matched = rows.filter((r) => {
      return r.languageCode === language
    })
    filtered = matched
  }

  return filtered.map((r) => ({
    id: r.id.toString(),
    title: r.title,
    slug: r.slug,
    language: r.languageCode || undefined,
  }))
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
}
