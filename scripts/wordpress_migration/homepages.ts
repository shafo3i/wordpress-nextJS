import { studioDocumentSchema } from "../../db/schema/cms-studio"
import {
  createStudioContainerFromPreset,
  createStudioElement,
} from "../../lib/studio/tree-helpers"
import type { StudioWidgetType, StudioElement } from "../../lib/studio/types"

export function homepageDocument(
  locale: string,
  categories: { id: string; slug: string }[]
) {
  const widget = (
    type: StudioWidgetType,
    count: number,
    category?: { id: string; slug: string }
  ) => {
    const element = createStudioElement(type)
    element.settings.blockConfig = {
      ...element.settings.blockConfig!,
      title: "",
      contentLocale: locale,
      postCount: count,
      categorySlug: category?.slug || "all",
      ...(category ? { categoryId: category.id } : {}),
      featuredOnly: false,
    }
    return element
  }
  const section = (children: StudioElement[]) => {
    const container = createStudioContainerFromPreset("100")
    container.settings.paddingTop = 8
    container.settings.paddingBottom = 8
    container.elements[0].settings.paddingTop = 0
    container.elements[0].settings.paddingBottom = 0
    container.elements[0].elements = children
    return container
  }
  const elements = [
    section([widget("block_breaking_ticker", 8)]),
    section([widget("block_headline_slider", 5)]),
    section([widget("block_broadsheet_3col", 8)]),
  ]
  const split = createStudioContainerFromPreset("66_33")
  split.settings.paddingTop = 8
  split.settings.paddingBottom = 8
  split.elements[0].elements = [
    widget("block_dual_category_columns", 8, categories[0]),
  ]
  split.elements[1].elements = [
    widget("block_recent_posts", 5),
    widget("block_popular_posts", 5),
  ]
  elements.push(split)
  for (const category of categories.slice(1, 3))
    elements.push(section([widget("block_news_list", 6, category)]))
  return studioDocumentSchema.parse({
    version: "1.0",
    pageTemplate: "studio_full_width",
    elements,
    settings: { pageTemplate: "studio_full_width", hideTitle: true },
  })
}
