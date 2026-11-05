import type {
  StudioElement,
  StudioElementSettings,
  StudioWidgetType,
} from "@/lib/studio/types"
import type { AvailableWidgetDescriptor } from "@/lib/widgets/types"
import type { StudioCategory } from "@/lib/studio/content"

export interface StudioLeftPanelProps {
  pageLocale?: string
  contentLocale?: string
  panelMode: "elements" | "inspector"
  onSetPanelMode: (mode: "elements" | "inspector") => void
  selectedElement: StudioElement | null
  onAddOrInsertWidget: (widgetType: StudioWidgetType) => void
  onUpdateElement: (
    id: string,
    updater: (el: StudioElement) => StudioElement
  ) => void
  onUpdateSettings: (id: string, patch: Partial<StudioElementSettings>) => void
  onDuplicateElement: (id: string) => void
  onDeleteElement: (id: string) => void
  categories: StudioCategory[]
  availableWidgets: AvailableWidgetDescriptor[]
  dict?: Record<string, string>
  direction?: "rtl" | "ltr"
  languages?: { code: string; name: string; nativeName?: string | null }[]
}

export type StudioInspectorProps = StudioLeftPanelProps & {
  selectedElement: StudioElement
}
