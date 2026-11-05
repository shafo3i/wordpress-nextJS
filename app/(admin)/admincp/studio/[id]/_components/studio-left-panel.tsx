"use client"

import type { StudioLeftPanelProps } from "./studio-panel-types"
import { StudioElementCatalog } from "./studio-element-catalog"
import { StudioElementInspector } from "./studio-element-inspector"

export function StudioLeftPanel(props: StudioLeftPanelProps) {
  if (props.panelMode === "elements" || !props.selectedElement) {
    return <StudioElementCatalog {...props} />
  }
  return (
    <StudioElementInspector
      {...props}
      selectedElement={props.selectedElement}
    />
  )
}
