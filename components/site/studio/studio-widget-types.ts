import type { StudioElement } from "@/lib/studio/types"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import type { StudioContentSnapshot } from "@/lib/studio/content"
export interface StudioWidgetProps {
  element: StudioElement
  posts: ContentItem[]
  theme: FrontEndThemeContext
  isEditor?: boolean
  dict?: Record<string, string>
  widgetContent?: StudioContentSnapshot
  liveContent?: boolean
  contentLocale?: string
  pageLocale?: string
}
