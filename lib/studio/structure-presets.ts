import type { StudioElement, StudioStructurePreset } from "./types"
import { createChildColumnContainer } from "./tree-helpers"

const PRESET_WIDTHS: Record<StudioStructurePreset, number[]> = {
  "100": [100],
  "50_50": [50, 50],
  "66_33": [66.66, 33.33],
  "33_66": [33.33, 66.66],
  "33_33_33": [33.33, 33.33, 33.33],
  "25_50_25": [25, 50, 25],
  "25_25_25_25": [25, 25, 25, 25],
  grid_2: [50, 50],
  grid_3: [33.33, 33.33, 33.33],
}

/** Resize the column layout without dropping widgets or removed columns' content. */
export function applyStudioStructurePreset(
  element: StudioElement,
  preset: StudioStructurePreset
): StudioElement {
  const widths = PRESET_WIDTHS[preset]
  const columns = element.elements.filter(
    (child) => child.elType === "container"
  )
  const looseWidgets = element.elements.filter(
    (child) => child.elType !== "container"
  )
  const nextColumns = widths.map((widthPercent, index) => {
    const column = columns[index] || createChildColumnContainer(widthPercent)
    return {
      ...column,
      settings: { ...column.settings, widthPercent },
      elements: [...column.elements],
    }
  })

  // Keep removed containers intact so nested styles, IDs, and content survive.
  nextColumns[nextColumns.length - 1].elements.push(
    ...columns.slice(widths.length),
    ...looseWidgets
  )

  return {
    ...element,
    settings: {
      ...element.settings,
      containerType: preset.startsWith("grid_") ? "grid" : "flexbox",
      gridColumns: preset.startsWith("grid_") ? widths.length : undefined,
      flexDirection: "row",
    },
    elements: nextColumns,
  }
}
