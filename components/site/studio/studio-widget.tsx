import type { StudioWidgetProps } from "./studio-widget-types"
import { StudioContentWidgets } from "./studio-content-widgets"
import { StudioMediaWidgets } from "./studio-media-widgets"
import { StudioDataWidgets } from "./studio-data-widgets"
import { StudioAdvancedWidgets } from "./studio-advanced-widgets"
import { StudioContentWidget } from "./studio-content-widget"
import {
  getStudioWidgetDefinition,
  isStudioElementCompatible,
} from "@/lib/studio/widget-registry"
const WIDGET_RENDERERS = {
  content: StudioContentWidgets,
  media: StudioMediaWidgets,
  data: StudioDataWidgets,
  advanced: StudioAdvancedWidgets,
}
export function StudioWidget(props: StudioWidgetProps) {
  const definition = getStudioWidgetDefinition(props.element.widgetType)
  if (!definition || !isStudioElementCompatible(props.element)) return null
  if (
    definition.renderGroup === "editorial" ||
    definition.renderGroup === "global" ||
    props.element.widgetType === "sidebar"
  )
    return <StudioContentWidget {...props} />
  const Renderer =
    WIDGET_RENDERERS[definition.renderGroup as keyof typeof WIDGET_RENDERERS]
  return Renderer ? <Renderer {...props} /> : null
}
