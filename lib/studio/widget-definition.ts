import type {
  StudioAtomicWidgetType,
  StudioContainerType,
  StudioElementSettings,
  StudioWidgetType,
} from "./types"
export type StudioCatalogGroup = "atomic" | "layout" | "basic" | "general"
export type StudioRenderGroup =
  | "content"
  | "media"
  | "data"
  | "advanced"
  | "container"
  | "editorial"
  | "global"
export type StudioControlGroup = "layout" | "atomic" | "editorial" | "global"
export type StudioIconName =
  | "Square"
  | "Columns3"
  | "Grid"
  | "FolderKanban"
  | "ListCollapse"
  | "Heading"
  | "ImageIcon"
  | "Type"
  | "FileCode"
  | "RectangleHorizontal"
  | "Video"
  | "Minus"
  | "SquareDashed"
  | "FileText"
  | "MoveVertical"
  | "MapPin"
  | "Star"
  | "GalleryHorizontal"
  | "Images"
  | "ListChecks"
  | "Hash"
  | "BarChart3"
  | "MessageSquareQuote"
  | "Share2"
  | "AlertCircle"
  | "Headphones"
  | "Code2"
  | "Anchor"
  | "LayoutPanelLeft"
  | "BookOpen"
  | "Spline"
export interface StudioWidgetDefinition {
  type: StudioWidgetType
  kind: "container" | "widget"
  labelKey: string
  icon: StudioIconName
  catalogs: readonly StudioCatalogGroup[]
  renderGroup: StudioRenderGroup
  controlGroup: StudioControlGroup
  createSettings: (category?: string) => StudioElementSettings
}

export function defineWidget(
  type: StudioAtomicWidgetType | StudioContainerType,
  definition: Omit<StudioWidgetDefinition, "type" | "labelKey">
): StudioWidgetDefinition {
  return { type, labelKey: `admin.studio.el.${type}`, ...definition }
}
