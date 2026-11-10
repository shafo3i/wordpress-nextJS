import type { StudioDesign } from "@/db/schema/cms-studio-design"
import type {
  HomepageBlock,
  HomepageBlockType,
} from "@/lib/themes/homepage-types"

export type StudioElementType = "container" | "widget"

export type StudioContainerType = "flexbox" | "grid" | "div" | "container"

export type StudioAtomicWidgetType =
  | "heading"
  | "paragraph"
  | "text_editor"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "youtube"
  | "video"
  | "google_maps"
  | "icon"
  | "tabs"
  | "accordion"
  | "image_box"
  | "icon_box"
  | "image_carousel"
  | "basic_gallery"
  | "icon_list"
  | "counter"
  | "progress_bar"
  | "testimonial"
  | "social_icons"
  | "alert"
  | "soundcloud"
  | "shortcode"
  | "html"
  | "menu_anchor"
  | "sidebar"
  | "read_more"
  | "rating"
  | "text_path"
  | "svg"

export type StudioWidgetType =
  | StudioContainerType
  | StudioAtomicWidgetType
  | `block_${HomepageBlockType}`
  | `widget_${string}`

export interface StudioTabItem {
  id: string
  title: string
  content: string
}

export interface StudioElementSettings {
  // Container Layout Settings
  containerType?: StudioContainerType
  contentWidth?: "inherit" | "boxed" | "full"
  customWidth?: boolean
  maxWidth?: number
  minHeight?: number
  widthPercent?: number
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse"
  justifyContent?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly"
  alignItems?: "stretch" | "flex-start" | "center" | "flex-end"
  flexWrap?: "nowrap" | "wrap"
  gridColumns?: number
  gap?: number

  // Atomic & General Widget Content Settings
  text?: string
  subText?: string
  htmlTag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span"
  align?: "start" | "center" | "end" | "justify"
  linkUrl?: string
  linkTarget?: "_self" | "_blank"
  imageUrl?: string
  imageAlt?: string
  imageHeight?: number
  objectFit?: "cover" | "contain" | "fill"
  buttonText?: string
  buttonUrl?: string
  buttonVariant?: "primary" | "secondary" | "outline" | "dark"
  buttonSize?: "sm" | "md" | "lg"
  videoUrl?: string
  aspectRatio?: "16/9" | "4/3" | "1/1"
  dividerStyle?: "solid" | "dashed" | "dotted" | "double"
  dividerWeight?: number
  dividerColor?: string
  spacerHeight?: number
  tabsItems?: StudioTabItem[]
  accordionItems?: StudioTabItem[]
  svgCode?: string
  htmlCode?: string
  mapAddress?: string
  mapZoom?: number
  iconName?: string
  iconSize?: number
  galleryImages?: string[]
  counterValue?: number
  counterSuffix?: string
  progressPercent?: number
  testimonialName?: string
  testimonialRole?: string
  testimonialAvatar?: string
  socialLinks?: { platform: string; url: string }[]
  alertType?: "info" | "success" | "warning" | "danger"
  soundcloudUrl?: string
  shortcodeText?: string
  anchorId?: string
  ratingValue?: number
  ratingMax?: number

  // Editorial Block & Global Widget Payloads
  blockConfig?: HomepageBlock
  widgetId?: string
  widgetTitle?: string
  widgetConfig?: Record<string, unknown>
  widgetLocale?: string

  design?: StudioDesign

  // Style Settings
  textColor?: string
  tickerLabelColor?: string
  tickerLabelBackground?: string
  tickerMetaColor?: string
  tickerControlsColor?: string
  backgroundColor?: string
  fontSize?: number
  fontWeight?: "400" | "500" | "600" | "700" | "800" | "900"
  lineHeight?: number
  letterSpacing?: number
  borderStyle?: "none" | "solid" | "dashed" | "dotted"
  borderWidth?: number
  borderColor?: string
  borderRadius?: number
  boxShadow?: "none" | "sm" | "md" | "lg" | "xl"

  // Advanced Settings (Spacing, Visibility, Attributes)
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  customClass?: string
  customId?: string
  hideOnDesktop?: boolean
  hideOnTablet?: boolean
  hideOnMobile?: boolean
}

export interface StudioElement {
  id: string
  elType: StudioElementType
  widgetType: StudioWidgetType
  title?: string
  hidden?: boolean
  settings: StudioElementSettings
  elements: StudioElement[]
}

export type StudioPageTemplate =
  "studio_full_width" | "studio_canvas" | "default" | "with-sidebar"

export interface StudioDocumentData {
  version: string
  pageTemplate: StudioPageTemplate
  elements: StudioElement[]
  settings?: {
    pageTemplate?: StudioPageTemplate
    hideTitle?: boolean
    backgroundColor?: string
  }
}

export type StudioStructurePreset =
  | "100"
  | "50_50"
  | "66_33"
  | "33_66"
  | "33_33_33"
  | "25_50_25"
  | "25_25_25_25"
  | "grid_2"
  | "grid_3"

export interface StudioSaveRequest {
  pageId: string
  title?: string
  status?: string
  template?: string
  document: StudioDocumentData
  setAsFrontPage?: boolean
}

export type StudioSaveResult =
  | { success: true; document: StudioDocumentData; status: string }
  | { success: false; error: string }
