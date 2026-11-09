import { describe, expect, it } from "vitest"
import { studioDocumentSchema } from "@/db/schema/cms-studio"
import {
  getStudioCatalogItems,
  getStudioWidgetDefinition,
  isStudioElementCompatible,
  STUDIO_WIDGET_REGISTRY,
  STUDIO_EDITORIAL_TYPES,
} from "@/lib/studio/widget-registry"
import { createStudioElement } from "@/lib/studio/tree-helpers"

describe("Studio widget definitions", () => {
  it.each(STUDIO_EDITORIAL_TYPES)(
    "creates saveable editorial defaults for %s",
    (type) => {
      const element = createStudioElement(`block_${type}`)
      expect(
        studioDocumentSchema.safeParse({
          version: "1.0",
          pageTemplate: "studio_full_width",
          elements: [element],
        }).success
      ).toBe(true)
    }
  )
  it("validates rotation settings without changing the feed identity", () => {
    const element = createStudioElement("block_headline_slider")
    const block = element.settings.blockConfig!
    expect(block.title).toBe("")
    expect(block.featuredOnly).toBe(false)
    block.rotationInterval = 1
    expect(
      studioDocumentSchema.safeParse({ version: "1.0", elements: [element] })
        .success
    ).toBe(false)
  })
  it.each(Object.values(STUDIO_WIDGET_REGISTRY))(
    "creates schema-valid defaults for $type",
    (definition) => {
      const element = createStudioElement(definition.type)
      expect(isStudioElementCompatible(element)).toBe(true)
      expect(
        studioDocumentSchema.safeParse({
          version: "1.0",
          pageTemplate: "studio_full_width",
          elements: [element],
        }).success
      ).toBe(true)
    }
  )

  it("resolves catalog membership, renderer, and control group from the same definition", () => {
    const heading = getStudioWidgetDefinition("heading")!
    expect(getStudioCatalogItems("basic")).toContain(heading)
    expect(heading.renderGroup).toBe("content")
    expect(heading.controlGroup).toBe("atomic")
  })

  it.each(["constructor", "__proto__", "toString", "unknown", "block_missing"])(
    "rejects unregistered built-in names: %s",
    (type) => {
      expect(getStudioWidgetDefinition(type)).toBeUndefined()
    }
  )

  it("rejects a widget disguised as a container or paired with a different block payload", () => {
    const element = createStudioElement("heading")
    element.elType = "container"
    expect(isStudioElementCompatible(element)).toBe(false)
    const block = createStudioElement("block_news_list")
    block.settings.blockConfig!.type = "hero_slider"
    expect(isStudioElementCompatible(block)).toBe(false)
  })

  it("does not share mutable default settings between inserted widgets", () => {
    const one = createStudioElement("tabs")
    const two = createStudioElement("tabs")
    one.settings.tabsItems![0].title = "Changed"
    expect(two.settings.tabsItems![0].title).toBe("")
    expect(one.settings.tabsItems![0].id).not.toBe(
      two.settings.tabsItems![0].id
    )
  })
})
