import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: React.ReactNode }) => createElement("a", props, children) }))
import { createStarterTemplateElements, createStudioElement } from "@/lib/studio/tree-helpers"
import { StudioElementCatalog } from "@/app/(admin)/admincp/studio/[id]/_components/studio-element-catalog"
import { getStudioDocumentRequests } from "@/lib/studio/content"
import { studioDocumentSchema } from "@/db/schema/cms-studio"
import { renderEditorialBlock } from "@/components/site/blocks/registry"
import { DEFAULT_THEME } from "@/components/site/utils"
import type { ContentItem } from "@/lib/site-content"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"

it("exposes a draggable Category column tile with saveable defaults in both catalog languages", () => {
  for (const dict of [en, ar]) {
    const html = renderToStaticMarkup(createElement(StudioElementCatalog, {
      dict, availableWidgets: [], onAddOrInsertWidget: () => {}, panelMode: "elements", onSetPanelMode: () => {},
      selectedElement: null, onUpdateElement: () => {}, onUpdateSettings: () => {},
      onDuplicateElement: () => {}, onDeleteElement: () => {}, categories: [],
    }))
    expect(html).toContain(dict["admin.theme_settings.block.category_column.name"])
  }
  const element = createStudioElement("block_category_column")
  expect(element.settings.blockConfig).toMatchObject({ type: "category_column", displayStyle: "category_column", categorySlug: "", postCount: 5 })
  expect(studioDocumentSchema.safeParse({ version: "1.0", pageTemplate: "studio_full_width", elements: [element] }).success).toBe(true)
})

it("creates four independent editable feeds and does not fetch unrelated posts before selection", () => {
  const elements = createStarterTemplateElements("category_columns")
  const document = { version: "1.0" as const, pageTemplate: "studio_full_width" as const, elements }
  expect(studioDocumentSchema.safeParse(document).success).toBe(true)
  expect(elements[0].elements).toHaveLength(4)
  expect(getStudioDocumentRequests(document, "en")).toEqual([])
  const widgets = elements[0].elements.map(column => column.elements[0])
  widgets[0].settings.blockConfig!.categoryId = "10"
  widgets[1].settings.blockConfig!.categoryId = "20"
  const requests = getStudioDocumentRequests(document, "en")
  expect(requests.map(request => request.categoryId)).toEqual(["10", "20"])
  expect(requests.every(request => request.locale === "en" && request.pageSize === 5)).toBe(true)
  expect(new Set(widgets.map(widget => widget.id)).size).toBe(4)
})

it("uses the resolved category for its automatic heading and archive link", () => {
  const widget = createStarterTemplateElements("category_columns")[0].elements[0].elements[0]
  const post: ContentItem = { id: "1", title: "Category story", slug: "story", categories: [], tags: [], date: new Date("2026-11-22"), excerpt: "", content: "", authorName: "", imageUrl: "" }
  const html = renderToStaticMarkup(renderEditorialBlock({
    block: { ...widget.settings.blockConfig!, categoryId: "10" }, posts: [post], preFiltered: true,
    resolvedCategory: { name: "World", slug: "world" },
    theme: { ...DEFAULT_THEME, locale: "en", defaultLocale: "ar", dict: en },
  }))
  expect(html).toContain("World")
  expect(html).toContain('href="/en/category/world"')
  expect(html).toContain(en["site.read_more"])
  expect(html).toContain("Category story")
})
