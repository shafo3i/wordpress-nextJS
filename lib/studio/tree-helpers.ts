import type {
  StudioDocumentData,
  StudioElement,
  StudioElementSettings,
  StudioStructurePreset,
  StudioWidgetType,
} from "./types"
import { generateStudioId } from "./ids"
import { getStudioWidgetDefinition } from "./widget-registry"
export { generateStudioId } from "./ids"
export { createDefaultBlockConfig } from "./block-defaults"

export function createChildColumnContainer(
  widthPercent: number
): StudioElement {
  return {
    id: generateStudioId("col"),
    elType: "container",
    widgetType: "flexbox",
    settings: {
      containerType: "flexbox",
      contentWidth: "full",
      widthPercent,
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "stretch",
      gap: 16,
      paddingTop: 4,
      paddingRight: 12,
      paddingBottom: 4,
      paddingLeft: 12,
    },
    elements: [],
  }
}

export function createStudioContainerFromPreset(
  preset: StudioStructurePreset
): StudioElement {
  const presetWidths: Record<StudioStructurePreset, number[]> = {
    "100": [100],
    "50_50": [50, 50],
    "66_33": [66.66, 33.33],
    "33_66": [33.33, 66.66],
    "33_33_33": [33.33, 33.33, 33.33],
    "25_50_25": [25, 50, 25],
    "25_25_25_25": [25, 25, 25, 25],
    grid_2: [50, 50, 50, 50],
    grid_3: [33.33, 33.33, 33.33],
  }

  const isGrid = preset === "grid_2" || preset === "grid_3"
  const widths = presetWidths[preset] || [100]

  return {
    id: generateStudioId("con"),
    elType: "container",
    widgetType: isGrid ? "grid" : "flexbox",
    settings: {
      containerType: isGrid ? "grid" : "flexbox",
      contentWidth: "inherit",
      flexDirection: widths.length > 1 && !isGrid ? "row" : "column",
      justifyContent: "flex-start",
      alignItems: "stretch",
      gridColumns: preset === "grid_3" ? 3 : preset === "grid_2" ? 2 : 1,
      gap: 24,
      paddingTop: 8,
      paddingRight: 16,
      paddingBottom: 8,
      paddingLeft: 16,
    },
    elements: widths.map((w) => createChildColumnContainer(w)),
  }
}

export function createStudioElement(
  widgetType: StudioWidgetType,
  defaultCategory = "all"
): StudioElement {
  const definition = getStudioWidgetDefinition(widgetType)
  if (!definition) throw new Error("Unknown Studio widget type.")
  const settings = definition.createSettings(defaultCategory)
  const container = definition.kind === "container"
  const widths =
    settings.containerType === "flexbox"
      ? [50, 50]
      : settings.containerType === "grid"
        ? [33.33, 33.33, 33.33]
        : []
  return {
    id: generateStudioId(container ? "con" : "el"),
    elType: definition.kind,
    widgetType: settings.containerType || widgetType,
    settings,
    elements: container ? widths.map(createChildColumnContainer) : [],
  }
}

export function findElementById(
  elements: StudioElement[],
  id: string | null
): StudioElement | null {
  if (!id) return null
  for (const el of elements) {
    if (el.id === id) return el
    if (el.elements.length > 0) {
      const found = findElementById(el.elements, id)
      if (found) return found
    }
  }
  return null
}

export function updateElementInTree(
  elements: StudioElement[],
  id: string,
  updater: (el: StudioElement) => StudioElement
): StudioElement[] {
  return elements.map((el) => {
    if (el.id === id) {
      return updater(el)
    }
    if (el.elements.length > 0) {
      return {
        ...el,
        elements: updateElementInTree(el.elements, id, updater),
      }
    }
    return el
  })
}

export function updateElementSettingsInTree(
  elements: StudioElement[],
  id: string,
  settingsPatch: Partial<StudioElementSettings>
): StudioElement[] {
  return updateElementInTree(elements, id, (el) => ({
    ...el,
    settings: {
      ...el.settings,
      ...settingsPatch,
    },
  }))
}

export function deleteElementFromTree(
  elements: StudioElement[],
  id: string
): StudioElement[] {
  return elements
    .filter((el) => el.id !== id)
    .map((el) => ({
      ...el,
      elements:
        el.elements.length > 0 ? deleteElementFromTree(el.elements, id) : [],
    }))
}

function cloneElementWithNewIds(el: StudioElement): StudioElement {
  const cloned = structuredClone(el)
  return {
    ...cloned,
    id: generateStudioId(el.elType === "container" ? "con" : "el"),
    settings: {
      ...cloned.settings,
      blockConfig: el.settings.blockConfig
        ? { ...cloned.settings.blockConfig!, id: generateStudioId("block") }
        : undefined,
    },
    elements: cloned.elements.map(cloneElementWithNewIds),
  }
}

export function duplicateElementInTree(
  elements: StudioElement[],
  id: string
): { tree: StudioElement[]; newId: string | null } {
  let createdId: string | null = null

  function walk(list: StudioElement[]): StudioElement[] {
    const next: StudioElement[] = []
    for (const item of list) {
      if (item.id === id) {
        const clone = cloneElementWithNewIds(item)
        createdId = clone.id
        next.push(item, clone)
      } else if (item.elements.length > 0) {
        next.push({
          ...item,
          elements: walk(item.elements),
        })
      } else {
        next.push(item)
      }
    }
    return next
  }

  return { tree: walk(elements), newId: createdId }
}

export function moveElementInTree(
  elements: StudioElement[],
  id: string,
  direction: "up" | "down"
): StudioElement[] {
  const idx = elements.findIndex((el) => el.id === id)
  if (idx !== -1) {
    const target = direction === "up" ? idx - 1 : idx + 1
    if (target < 0 || target >= elements.length) return elements
    const copy = [...elements]
    const [removed] = copy.splice(idx, 1)
    copy.splice(target, 0, removed)
    return copy
  }

  return elements.map((el) => ({
    ...el,
    elements:
      el.elements.length > 0
        ? moveElementInTree(el.elements, id, direction)
        : [],
  }))
}

export function insertElementIntoContainer(
  elements: StudioElement[],
  containerId: string,
  newElement: StudioElement
): StudioElement[] {
  return elements.map((el) => {
    if (el.id === containerId && el.elType === "container") {
      return {
        ...el,
        elements: [...el.elements, newElement],
      }
    }
    if (el.elements.length > 0) {
      return {
        ...el,
        elements: insertElementIntoContainer(
          el.elements,
          containerId,
          newElement
        ),
      }
    }
    return el
  })
}

export function parseStudioDocument(raw?: string | null): StudioDocumentData {
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.elements)) {
        return {
          version: parsed.version || "1.0",
          pageTemplate: parsed.pageTemplate || "studio_full_width",
          elements: parsed.elements,
          settings: parsed.settings,
        }
      }
    } catch {
      // Fall through to default
    }
  }

  return {
    version: "1.0",
    pageTemplate: "studio_full_width",
    elements: [createStudioContainerFromPreset("33_33_33")],
  }
}

export function createStarterTemplateElements(
  templateId:
    | "magazine_home"
    | "broadsheet_home"
    | "editorial_portal"
    | "landing_showcase"
): StudioElement[] {
  if (templateId === "magazine_home") {
    const heroSec = createStudioContainerFromPreset("100")
    heroSec.elements[0].elements.push(
      createStudioElement("block_magazine_bento")
    )

    const splitSec = createStudioContainerFromPreset("66_33")
    splitSec.elements[0].elements.push(
      createStudioElement("block_hero_slider"),
      createStudioElement("block_news_list")
    )
    splitSec.elements[1].elements.push(
      createStudioElement("block_trending"),
      createStudioElement("widget_weather"),
      createStudioElement("block_newsletter")
    )

    const bottomSec = createStudioContainerFromPreset("100")
    bottomSec.elements[0].elements.push(
      createStudioElement("block_visual_grid"),
      createStudioElement("block_multimedia")
    )

    return [heroSec, splitSec, bottomSec]
  }

  if (templateId === "broadsheet_home") {
    const wireSec = createStudioContainerFromPreset("100")
    wireSec.elements[0].elements.push(
      createStudioElement("block_broadsheet_3col")
    )

    const mainSideSec = createStudioContainerFromPreset("66_33")
    mainSideSec.elements[0].elements.push(
      createStudioElement("block_big_lead_side_list"),
      createStudioElement("block_opinion")
    )
    mainSideSec.elements[1].elements.push(
      createStudioElement("block_trending"),
      createStudioElement("widget_recent_posts"),
      createStudioElement("block_newsletter")
    )

    return [wireSec, mainSideSec]
  }

  if (templateId === "editorial_portal") {
    const topSec = createStudioContainerFromPreset("100")
    topSec.elements[0].elements.push(
      createStudioElement("block_tabbed_block"),
      createStudioElement("block_category_grid")
    )

    const gridSec = createStudioContainerFromPreset("50_50")
    gridSec.elements[0].elements.push(createStudioElement("block_visual_grid"))
    gridSec.elements[1].elements.push(createStudioElement("block_news_list"))

    return [topSec, gridSec]
  }

  // landing_showcase
  const hero = createStudioContainerFromPreset("50_50")
  hero.elements[0].elements.push(
    createStudioElement("heading"),
    createStudioElement("paragraph"),
    createStudioElement("button")
  )
  hero.elements[1].elements.push(createStudioElement("image"))

  const features = createStudioContainerFromPreset("33_33_33")
  features.elements[0].elements.push(
    createStudioElement("heading"),
    createStudioElement("paragraph")
  )
  features.elements[1].elements.push(
    createStudioElement("heading"),
    createStudioElement("paragraph")
  )
  features.elements[2].elements.push(
    createStudioElement("heading"),
    createStudioElement("paragraph")
  )

  return [hero, features]
}
