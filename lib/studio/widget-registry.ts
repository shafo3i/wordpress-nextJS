import type {
  StudioAtomicWidgetType,
  StudioContainerType,
  StudioElement,
  StudioWidgetType,
} from "./types"
import type { HomepageBlockType } from "@/lib/themes/homepage-types"
import { createDefaultBlockConfig } from "./block-defaults"
import type {
  StudioWidgetDefinition,
  StudioCatalogGroup,
} from "./widget-definition"
export type {
  StudioWidgetDefinition,
  StudioCatalogGroup,
  StudioControlGroup,
  StudioRenderGroup,
  StudioIconName,
} from "./widget-definition"
import { CONTAINER_WIDGETS } from "./widget-definitions/container"
import { CONTENT_WIDGETS } from "./widget-definitions/content"
import { MEDIA_WIDGETS } from "./widget-definitions/media"
import { ADVANCED_WIDGETS } from "./widget-definitions/advanced"
import { DATA_WIDGETS } from "./widget-definitions/data"

export const STUDIO_WIDGET_REGISTRY = {
  ...CONTAINER_WIDGETS,
  ...CONTENT_WIDGETS,
  ...MEDIA_WIDGETS,
  ...ADVANCED_WIDGETS,
  ...DATA_WIDGETS,
} satisfies Record<
  StudioAtomicWidgetType | StudioContainerType,
  StudioWidgetDefinition
>

export const STUDIO_EDITORIAL_TYPES = [
  "headline_slider",
  "featured_hero_slider",
  "hero_slider",
  "magazine_bento",
  "broadsheet_3col",
  "split_hero_feature",
  "multi_card_carousel",
  "big_lead_side_list",
  "dual_category_columns",
  "compact_numbered_grid",
  "breaking_ticker",
  "news_list",
  "visual_grid",
  "category_grid",
  "tabbed_block",
  "trending",
  "opinion",
  "multimedia",
  "newsletter",
  "hero",
] as const satisfies readonly HomepageBlockType[]
const editorialTypes = new Set<string>(STUDIO_EDITORIAL_TYPES)

export function getStudioCatalogItems(
  group: StudioCatalogGroup
): StudioWidgetDefinition[] {
  return Object.values(STUDIO_WIDGET_REGISTRY).filter((item) =>
    item.catalogs.includes(group)
  )
}

export function getStudioWidgetDefinition(
  type: string
): StudioWidgetDefinition | undefined {
  if (typeof type !== "string") return undefined
  if (Object.prototype.hasOwnProperty.call(STUDIO_WIDGET_REGISTRY, type))
    return STUDIO_WIDGET_REGISTRY[type as keyof typeof STUDIO_WIDGET_REGISTRY]
  if (type.startsWith("block_") && editorialTypes.has(type.slice(6)))
    return {
      type: type as StudioWidgetType,
      kind: "widget",
      labelKey: `admin.theme_settings.block.${type.slice(6)}.name`,
      icon: "FileText",
      catalogs: [],
      renderGroup: "editorial",
      controlGroup: "editorial",
      createSettings: (category) => ({
        blockConfig: createDefaultBlockConfig(
          type.slice(6) as HomepageBlockType,
          category
        ),
      }),
    }
  if (/^widget_[a-z0-9_-]{1,100}$/.test(type))
    return {
      type: type as StudioWidgetType,
      kind: "widget",
      labelKey: `admin.widgets.descriptor.${type.slice(7)}.name`,
      icon: "FileText",
      catalogs: [],
      renderGroup: "global",
      controlGroup: "global",
      createSettings: () => ({
        widgetId: type.slice(7),
        widgetTitle: "",
        widgetLocale: "all",
        widgetConfig: {},
      }),
    }
  return undefined
}

export function isStudioElementCompatible(element: StudioElement): boolean {
  if (!element || !element.settings || !Array.isArray(element.elements))
    return false
  const definition = getStudioWidgetDefinition(element.widgetType)
  if (!definition || definition.kind !== element.elType) return false
  if (element.elType === "widget" && element.elements.length) return false
  if (definition.controlGroup === "editorial")
    return element.settings.blockConfig?.type === element.widgetType.slice(6)
  if (definition.controlGroup === "global")
    return element.settings.widgetId === element.widgetType.slice(7)
  return true
}

export const STUDIO_HEADING_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "div",
  "span",
] as const
export function getStudioHeadingTag(
  tag: unknown
): (typeof STUDIO_HEADING_TAGS)[number] {
  return typeof tag === "string" &&
    STUDIO_HEADING_TAGS.includes(tag as (typeof STUDIO_HEADING_TAGS)[number])
    ? (tag as (typeof STUDIO_HEADING_TAGS)[number])
    : "h2"
}
