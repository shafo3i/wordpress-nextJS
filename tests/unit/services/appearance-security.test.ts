import { beforeEach, describe, expect, it, vi } from "vitest"
import { PgDialect } from "drizzle-orm/pg-core"
import type { SQL } from "drizzle-orm"
import type { DB } from "@/db"
import { wpPosts, wpTerms, wpTermTaxonomy } from "@/db/schema"
const mocks = vi.hoisted(() => ({ guard: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/db", () => ({ db: {} }))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdmin: mocks.guard }))
vi.mock("@/services/language.service", () => ({
  getActiveLanguages: async () => [{ code: "en" }, { code: "ar" }],
}))
vi.mock("@/services/site-logo.service", () => ({
  getGlobalSiteLogo: async () => null,
}))
vi.mock("@/lib/plugins/loader", () => ({
  getActivePluginSlugs: async () => ["ad-manager"],
}))
import {
  saveMenu,
  createMenu,
  deleteMenu,
  setNavMenuLocations,
  getAllMenus,
  getPublishedPagesForMenu,
  getPublishedPostsForMenu,
  getCategoriesForMenu,
  getMenuById,
} from "@/services/menu.service"
import {
  saveCustomizerData,
  getCustomizerData,
  getCustomizerSections,
} from "@/lib/themes/customizer"
import { saveThemeLayout } from "@/services/theme-layout.service"
import { saveWidgetArea, getAllWidgetAreas } from "@/lib/widgets/db"
import {
  saveMenuSchema,
  widgetItemsSchema,
  customizerModsSchema,
  menuLocationsSchema,
} from "@/db/schema/cms-appearance"
import { sanitizeMods, resolveMods } from "@/lib/customizer/resolve"
import { sanitizeCustomCss } from "@/lib/customizer/css-policy"
import { parsePreviewState } from "@/lib/customizer/preview-protocol"
import { sanitizeWidgetItem } from "@/lib/widgets/security"
import { getWidget } from "@/widgets/registry"
function databaseWith(selects: unknown[][], inserted: unknown[][] = []) {
  const dialect = new PgDialect()
  const predicates: { sql: string; params: unknown[] }[] = []
  const writes: {
    table: unknown
    values?: Record<string, unknown> | unknown[]
    sql?: string
    params?: unknown[]
  }[] = []
  const tx = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => {
      const rows = selects.shift()
      if (!rows) throw new Error("Unexpected query")
      const pending = Promise.resolve(rows)
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        leftJoin: () => chain,
        orderBy: () => chain,
        offset: () => chain,
        groupBy: () => chain,
        limit: () => chain,
        for: () => chain,
        where: (condition: SQL) => {
          predicates.push(dialect.sqlToQuery(condition))
          return chain
        },
        then: pending.then.bind(pending),
      }
      return chain
    }),
    insert: vi.fn((table) => ({
      values: (values: Record<string, unknown> | unknown[]) => {
        writes.push({ table, values })
        const result = Promise.resolve([])
        return {
          then: result.then.bind(result),
          returning: async () => inserted.shift() || [],
          onConflictDoUpdate: async () => [],
          onConflictDoNothing: async () => [],
        }
      },
    })),
    update: vi.fn((table) => ({
      set: (values: Record<string, unknown>) => ({
        where: async (condition: SQL) => {
          writes.push({ table, values, ...dialect.sqlToQuery(condition) })
        },
      }),
    })),
    delete: vi.fn((table) => ({
      where: async (condition: SQL) => {
        writes.push({ table, ...dialect.sqlToQuery(condition) })
      },
    })),
  }
  let committed = false
  const transaction = vi.fn(async (callback: (tx: unknown) => unknown) => {
    const result = await callback(tx)
    committed = true
    return result
  })
  const database = { ...tx, transaction } as unknown as DB
  return {
    database,
    tx,
    predicates,
    writes,
    transaction,
    committed: () => committed,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.guard.mockResolvedValue({ user: { id: "admin", role: "admin" } })
})
const slug = "pressforge-broadsheet"
const patch = {
  layout: "full_width" as const,
  sidebarWidth: null,
  columnGap: 0,
  stickySidebars: false,
}
describe("Appearance service boundaries", () => {
  it("denies every privileged service before querying, including direct callers", async () => {
    mocks.guard.mockRejectedValue(Error("Forbidden"))
    const test = databaseWith([])
    for (const run of [
      () => saveMenu("1", "Menu", [], [], undefined, test.database),
      () => createMenu("Menu", test.database),
      () => deleteMenu("1", test.database),
      () => setNavMenuLocations({}, test.database),
      () => getAllMenus({}, test.database),
      () => getPublishedPagesForMenu({}, test.database),
      () => getPublishedPostsForMenu({}, test.database),
      () => getCategoriesForMenu({}, test.database),
      () =>
        saveCustomizerData(
          slug,
          {},
          { siteTitle: "Site", siteTagline: "" },
          false,
          test.database
        ),
      () => getCustomizerSections(slug),
      () => saveThemeLayout(slug, patch, test.database),
      () => saveWidgetArea("footer_1", [], test.database),
    ])
      await expect(run()).rejects.toThrow("Forbidden")
    expect(test.tx.select).not.toHaveBeenCalled()
    expect(test.transaction).not.toHaveBeenCalled()
  })
  it.each(["delete", "save"])(
    "rejects category/tag IDs as menu %s targets before writing",
    async (kind) => {
      const test = databaseWith([[]])
      await expect(
        kind === "delete"
          ? deleteMenu("1", test.database)
          : saveMenu("1", "Name", [], [], undefined, test.database)
      ).rejects.toThrow("Invalid menu")
      expect(test.writes).toHaveLength(0)
      expect(test.predicates[0].params).toContain("nav_menu")
      expect(test.committed()).toBe(false)
    }
  )
  it("rejects relationships that point to real posts rather than navigation items", async () => {
    const test = databaseWith([
      [{ termId: BigInt(2) }],
      [{ id: BigInt(8), type: "post" }],
    ])
    await expect(deleteMenu("1", test.database)).rejects.toThrow(
      "Invalid menu items"
    )
    expect(test.writes).toHaveLength(0)
  })
  it("rejects menu items shared across menus before updating or deleting", async () => {
    const test = databaseWith([
      [{ termId: BigInt(2) }],
      [{ id: BigInt(8), type: "nav_menu_item" }],
      [{ menuId: BigInt(7) }],
    ])
    await expect(deleteMenu("1", test.database)).rejects.toThrow(
      "Shared menu items"
    )
    expect(test.writes).toHaveLength(0)
  })
  it("rejects a forged item ID from another menu", async () => {
    const test = databaseWith([[{ termId: BigInt(2) }], []])
    await expect(
      saveMenu(
        "1",
        "Name",
        [{ id: "8", title: "Title", url: "/", order: 0 }],
        [],
        undefined,
        test.database
      )
    ).rejects.toThrow("Invalid item owner")
    expect(test.writes).toHaveLength(0)
  })
  it.each([
    "javascript:alert(1)",
    "data:text/html,evil",
    "//evil.test",
    "/\\evil.test",
    "https://user:pass@evil.test",
  ])("rejects unsafe menu URLs: %s", async (url) => {
    const test = databaseWith([])
    await expect(
      saveMenu(
        "1",
        "Menu",
        [{ title: "Title", url, order: 0 }],
        [],
        undefined,
        test.database
      )
    ).rejects.toThrow()
    expect(test.transaction).not.toHaveBeenCalled()
  })
  it("bounds menu batches, locations, targets and duplicate IDs", () => {
    for (const input of [
      { items: Array(201).fill({ title: "Title", url: "/", order: 0 }) },
      { locations: ["__proto__"] },
      { items: [{ title: "Title", url: "/", order: 0, target: "_top" }] },
      {
        items: [
          { id: "8", title: "A", url: "/", order: 0 },
          { id: "8", title: "B", url: "/", order: 1 },
        ],
      },
    ])
      expect(
        saveMenuSchema.safeParse({
          menuId: "1",
          name: "Menu",
          items: [],
          locations: [],
          ...input,
        }).success
      ).toBe(false)
    expect(
      menuLocationsSchema.safeParse(JSON.parse('{"__proto__":"1"}')).success
    ).toBe(false)
  })
  it("keeps shared category terms when removing their menu taxonomy", async () => {
    const test = databaseWith([
      [{ termId: BigInt(2) }],
      [],
      [{ id: BigInt(99) }],
      [{ value: '{"primary":"1","footer":"3"}' }],
    ])
    await deleteMenu("1", test.database)
    expect(test.committed()).toBe(true)
    expect(test.writes.some((write) => write.table === wpTerms)).toBe(false)
    const taxonomyDelete = test.writes.find(
      (write) => write.table === wpTermTaxonomy
    )
    expect(taxonomyDelete?.params).toContain("nav_menu")
  })
  it("preserves unpublished content records while saving navigation items", async () => {
    const test = databaseWith(
      [[{ termId: BigInt(2) }], [], [{ value: "{}" }]],
      [[{ id: BigInt(8) }]]
    )
    await saveMenu(
      "1",
      "Menu",
      [{ title: "Title", url: "/news", order: 8 }],
      [],
      "en",
      test.database
    )
    const values = test.writes.find((write) => write.table === wpPosts)
      ?.values as Record<string, unknown>
    expect(values.postType).toBe("nav_menu_item")
    expect(values.postAuthor).toBe("admin")
    expect(values.menuOrder).toBe(0)
    expect(test.committed()).toBe(true)
  })
  it("keeps public menu reads available while filtering dangerous legacy links", async () => {
    const test = databaseWith([
      [{ id: BigInt(1), termId: BigInt(2), name: "Menu", slug: "menu" }],
      [{ objectId: BigInt(8) }],
      [{ id: BigInt(8), title: "Bad", url: "javascript:alert(1)", order: 0 }],
      [{ value: "{}" }],
    ])
    expect((await getMenuById("1", test.database))?.items).toEqual([])
    expect(mocks.guard).not.toHaveBeenCalled()
  })
  it("keeps the public theme projection available without administrator authentication", async () => {
    mocks.guard.mockRejectedValue(Error("Forbidden"))
    const data = await getCustomizerData()
    expect(data.themeSlug).toBe(slug)
    expect(data.mods).toBeDefined()
    expect(mocks.guard).not.toHaveBeenCalled()
  })
  it("updates layout settings without accepting or overwriting builder content", async () => {
    const current = {
      layout: "right_sidebar",
      blocks: [{ id: "keep", title: "Existing block" }],
      sections: [],
    }
    const test = databaseWith([[{ value: JSON.stringify(current) }]])
    await saveThemeLayout(slug, patch, test.database)
    expect(test.committed()).toBe(true)
    const writes = JSON.stringify(test.writes.map((write) => write.values))
    expect(writes).toContain("Existing block")
    expect(writes).toContain("full_width")
  })
  it("does not fall back to other languages in menu selectors", async () => {
    const test = databaseWith([
      [{ id: BigInt(1), title: "Title", slug: "title", languageCode: "ar" }],
    ])
    expect(
      await getPublishedPagesForMenu({ language: "en" }, test.database)
    ).toEqual([])
  })
  it("validates customizer names and payload size before starting a transaction", async () => {
    for (const theme of ["../../evil", "unknown-theme"]) {
      const test = databaseWith([])
      await expect(
        saveCustomizerData(
          theme,
          {},
          { siteTitle: "Site", siteTagline: "" },
          false,
          test.database
        )
      ).rejects.toThrow()
      expect(test.transaction).not.toHaveBeenCalled()
    }
    expect(customizerModsSchema.safeParse({ value: Infinity }).success).toBe(
      false
    )
    expect(
      customizerModsSchema.safeParse(JSON.parse('{"constructor":"bad"}'))
        .success
    ).toBe(false)
  })
  it("saves theme activation, identity and sanitized mods atomically", async () => {
    const test = databaseWith([])
    await saveCustomizerData(
      slug,
      {
        customCss: "</style><script>alert(1)</script>",
        logoUrl: "javascript:alert(1)",
      },
      { siteTitle: " Site ", siteTagline: "Tagline" },
      true,
      test.database
    )
    expect(test.committed()).toBe(true)
    expect(test.writes).toHaveLength(6)
    const serialized = JSON.stringify(test.writes.map((write) => write.values))
    expect(serialized).not.toContain("<script>")
    expect(serialized).not.toContain("javascript:")
  })
  it("rejects unknown widget areas, malformed config and duplicate widget IDs", async () => {
    const test = databaseWith([])
    await expect(
      saveWidgetArea("../../option", [], test.database)
    ).rejects.toThrow()
    expect(test.transaction).not.toHaveBeenCalled()
    expect(
      widgetItemsSchema.safeParse([
        { id: "a", type: "custom_html", title: "" },
        { id: "a", type: "custom_html", title: "" },
      ]).success
    ).toBe(false)
    expect(
      widgetItemsSchema.safeParse([
        {
          id: "a",
          type: "custom_html",
          title: "",
          config: JSON.parse('{"__proto__":{"polluted":true}}'),
        },
      ]).success
    ).toBe(false)
  })
  it("does not mistake prototype properties for registered widgets", () => {
    for (const type of ["constructor", "__proto__", "prototype", "toString"])
      expect(getWidget(type)).toBeUndefined()
  })
  it("sanitizes nested widget links, content and counts on legacy reads", () => {
    const item = sanitizeWidgetItem({
      id: "a",
      type: "custom_html",
      title: "Title",
      content: '<img src=x onerror="alert(1)"><script>alert(1)</script>',
      config: {
        links: { x: "javascript:alert(1)" },
        imageUrl: "data:text/html,evil",
        wpm: 0,
        count: 10000,
      },
      count: 10000,
    })
    expect(item?.content).not.toMatch(/<script|onerror/)
    expect(item?.config?.links).toEqual({ x: "" })
    expect(item?.config?.imageUrl).toBe("")
    expect(item?.count).toBe(100)
    expect(item?.config?.wpm).toBe(20)
  })
  it("removes malformed renderer fields instead of passing objects to text or string methods", () => {
    const item = sanitizeWidgetItem({
      id: "a",
      type: "recent_posts",
      title: "",
      config: {
        categoryFilter: { bad: "object" },
        authorName: { bad: "object" },
        links: { x: { bad: "object" } },
        counts: { x: { bad: "object" } },
        openNewTab: "false",
        count: "huge",
      },
    })
    expect(item?.config?.categoryFilter).toBeUndefined()
    expect(item?.config?.authorName).toBeUndefined()
    expect(item?.config?.links).toEqual({})
    expect(item?.config?.counts).toEqual({})
    expect(item?.config?.openNewTab).toBeUndefined()
    expect(item?.config?.count).toBeUndefined()
  })
  it("writes a sanitized widget area while retaining other areas", async () => {
    const test = databaseWith([
      [
        {
          value: JSON.stringify([
            {
              id: "footer_2",
              items: [
                {
                  id: "old",
                  type: "custom_html",
                  title: "Keep",
                  content: "<p>Safe</p>",
                },
              ],
            },
          ]),
        },
      ],
    ])
    await saveWidgetArea(
      "footer_1",
      [
        {
          id: "new",
          type: "custom_html",
          title: "",
          content: "<script>alert(1)</script><p>Safe</p>",
        },
      ],
      test.database
    )
    expect(test.committed()).toBe(true)
    const serialized = JSON.stringify(test.writes.map((write) => write.values))
    expect(serialized).toContain("Keep")
    expect(serialized).not.toContain("<script>")
  })
  it("reads safe widget areas without requiring an admin session", async () => {
    const test = databaseWith([
      [
        {
          value:
            '[{"id":"footer_1","items":[{"id":"a","type":"constructor","title":"bad"}]}]',
        },
      ],
    ])
    const areas = await getAllWidgetAreas(test.database)
    expect(areas.find((area) => area.id === "footer_1")?.items).toEqual([])
    expect(mocks.guard).not.toHaveBeenCalled()
  })
})
describe("Customizer browser data and CSS", () => {
  it.each([
    "</style><script>alert(1)</script>",
    '@import "https://evil.test";',
    "a{background:u/**/rl(https://evil.test)}",
    "a{background:u\\72l(https://evil.test)}",
    "a{behavior:expression(alert(1))}",
  ])("blocks dangerous CSS: %s", (css) => {
    expect(sanitizeCustomCss(css)).toBe("")
  })
  it("retains ordinary CSS and responsive media rules", () => {
    const css = "@media (max-width:600px){.card {border:0;color:red}}"
    expect(sanitizeCustomCss(css)).toBe(css)
  })
  it("drops unsafe stored URLs and unregistered keys and preserves false toggles", () => {
    const mods = sanitizeMods(slug, {
      logoUrl: "//evil.test",
      socialFacebook: "javascript:alert(1)",
      customCss: "</style><script>alert(1)</script>",
      unknown: "bad",
      showSiteTitle: "false",
    })
    expect(mods.logoUrl).toBeUndefined()
    expect(mods.socialFacebook).toBeUndefined()
    expect(mods.customCss).toBe("")
    expect(mods.showSiteTitle).toBe(false)
    expect(mods).not.toHaveProperty("unknown")
    expect(
      resolveMods(slug, { socialFacebook: "javascript:alert(1)" })
        .socialFacebook || ""
    ).not.toContain("javascript:")
  })
  it("rejects malformed/oversized preview messages and sanitizes accepted messages", () => {
    expect(
      parsePreviewState(
        { mods: {}, siteTitle: "Site", siteTagline: "", page: "admin" },
        slug
      )
    ).toBeNull()
    expect(
      parsePreviewState(
        { mods: {}, siteTitle: "a".repeat(501), siteTagline: "", page: "home" },
        slug
      )
    ).toBeNull()
    expect(
      parsePreviewState(
        {
          mods: { logoUrl: "javascript:alert(1)" },
          siteTitle: "Site",
          siteTagline: "",
          page: "home",
        },
        slug
      )?.mods.logoUrl
    ).toBeUndefined()
  })
})
