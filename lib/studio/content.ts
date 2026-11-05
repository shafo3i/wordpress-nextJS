import type { ContentItem } from "@/lib/site-content"
import type { HomepageBlock } from "@/lib/themes/homepage-types"
import {
  studioContentRequestSchema,
  type StudioContentRequest,
} from "@/db/schema/cms-studio-content"
import type { StudioDocumentData, StudioElement } from "./types"

export interface StudioCategory {
  id: string
  name: string
  slug: string
  locale: string | null
  translationGroupId: string | null
}
export interface StudioContentResult {
  items: ContentItem[]
  total: number
  page: number
  pageSize: number
  locale: string
  direction: "ltr" | "rtl"
  category: StudioCategory | null
  categoryMissing: boolean
}
export interface StudioContentSnapshot {
  requests: Record<string, StudioContentResult>
  errors?: Record<string, string>
}

export function getStudioContentRequest(
  block: HomepageBlock,
  locale: string
): StudioContentRequest {
  return studioContentRequestSchema.parse({
    locale: block.contentLocale || locale,
    categoryId: block.categoryId,
    categorySlug: block.categorySlug || "all",
    featuredOnly: Boolean(
      block.featuredOnly ||
      block.type === "featured_hero_slider" ||
      block.displayStyle === "featured_slider"
    ),
    pageSize: block.postCount ?? 6,
    page: 1,
    sort: block.sortOrder || "newest",
  })
}
export function studioContentRequestKey(request: StudioContentRequest): string {
  return JSON.stringify([
    request.locale,
    request.categoryId || "",
    request.categorySlug,
    request.featuredOnly,
    request.pageSize,
    request.page,
    request.sort,
  ])
}
export function getStudioDocumentRequests(
  document: StudioDocumentData,
  locale: string
): StudioContentRequest[] {
  const requests = new Map<string, StudioContentRequest>()
  const walk = (elements: StudioDocumentData["elements"]) => {
    for (const element of elements) {
      if (element.hidden) continue
      const request = getStudioElementContentRequest(element, locale)
      if (request) requests.set(studioContentRequestKey(request), request)
      walk(element.elements)
    }
  }
  walk(document.elements)
  return [...requests.values()]
}
export function getStudioElementContentRequest(
  element: StudioElement,
  locale: string
): StudioContentRequest | undefined {
  if (
    element.widgetType.startsWith("block_") &&
    element.settings.blockConfig?.enabled
  )
    return getStudioContentRequest(element.settings.blockConfig, locale)
  if (
    (element.widgetType.startsWith("widget_") ||
      element.widgetType === "sidebar") &&
    element.settings.widgetId
  ) {
    const count = Number(element.settings.widgetConfig?.count ?? 6)
    return studioContentRequestSchema.parse({
      locale:
        element.settings.widgetLocale && element.settings.widgetLocale !== "all"
          ? element.settings.widgetLocale
          : locale,
      pageSize: Number.isFinite(count)
        ? Math.min(100, Math.max(1, Math.floor(count)))
        : 6,
    })
  }
  return undefined
}
export function getStudioCategoryOptions(
  categories: StudioCategory[],
  locale: string
): StudioCategory[] {
  const unique = new Map<string, StudioCategory>()
  for (const category of categories) {
    if (category.locale && category.locale !== locale) continue
    const key = category.translationGroupId || category.id
    if (!unique.has(key)) unique.set(key, category)
  }
  return [...unique.values()]
}
export function resolveStudioCategorySelection(
  categories: StudioCategory[],
  block: HomepageBlock,
  locale: string
): StudioCategory | undefined {
  const source = block.categoryId
    ? categories.find((category) => category.id === block.categoryId)
    : categories.find((category) => category.slug === block.categorySlug)
  if (!source) return undefined
  return (
    getStudioCategoryOptions(categories, locale).find(
      (category) =>
        category.id === source.id ||
        Boolean(
          source.translationGroupId &&
          category.translationGroupId === source.translationGroupId
        )
    ) || source
  )
}
export function getStudioBlockTitle(
  block: HomepageBlock,
  locale: string,
  sourceLocale: string
): string {
  return block.showTitle === false
    ? ""
    : (block.titles?.[locale] ?? (locale === sourceLocale ? block.title : ""))
}
