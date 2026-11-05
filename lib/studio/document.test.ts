import { describe, expect, it } from "vitest"
import {
  saveStudioPageSchema,
  studioDocumentSchema,
} from "@/db/schema/cms-studio"
import { applyStudioStructurePreset } from "./structure-presets"
import {
  createStudioContainerFromPreset,
  createStudioElement,
  parseStudioDocument,
} from "./tree-helpers"
import type { StudioDocumentData, StudioElement } from "./types"
import { getSafeStudioUrl } from "./urls"

const makeDocument = (): StudioDocumentData => ({
  version: "1.0",
  pageTemplate: "studio_canvas",
  settings: {
    hideTitle: true,
    backgroundColor: "#112233",
    pageTemplate: "studio_canvas",
  },
  elements: [createStudioContainerFromPreset("50_50")],
})

describe("Studio document persistence", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "java\nscript:alert(1)",
    "vbscript:alert(1)",
  ])("rejects executable widget URLs: %s", (buttonUrl) => {
    const doc = makeDocument()
    doc.elements[0].settings.buttonUrl = buttonUrl
    expect(studioDocumentSchema.safeParse(doc).success).toBe(false)
    expect(getSafeStudioUrl(buttonUrl)).toBe("")
  })

  it.each([
    "/contact",
    "#section",
    "https://example.org",
    "mailto:editor@example.org",
    "tel:+441234567890",
  ])("accepts a supported link: %s", (url) => {
    expect(getSafeStudioUrl(url)).toBe(url)
  })

  it("does not insert fabricated media or testimonials into new widgets", () => {
    expect(createStudioElement("image").settings.imageUrl).toBe("")
    expect(createStudioElement("video").settings.videoUrl).toBe("")
    expect(createStudioElement("testimonial").settings.testimonialName).toBe("")
    expect(createStudioElement("counter").settings.counterValue).toBe(0)
    expect(createStudioElement("basic_gallery").settings.galleryImages).toEqual(
      []
    )
  })
  it("preserves page settings, nested content and translations when loading saved JSON", () => {
    const doc = makeDocument()
    const block = createStudioElement("block_news_list")
    block.settings.blockConfig!.titles = { en: "News", ar: "أخبار" }
    doc.elements[0].elements[0].elements.push(block)
    expect(parseStudioDocument(JSON.stringify(doc))).toEqual(doc)
    expect(studioDocumentSchema.parse(doc)).toEqual(doc)
  })

  it.each(["admin", "deleted", "future", "", 1])(
    "rejects an unsupported publish status: %s",
    (status) => {
      expect(
        saveStudioPageSchema.safeParse({
          pageId: "1",
          status,
          document: makeDocument(),
        }).success
      ).toBe(false)
    }
  )

  it.each(["0", "-1", "1.5", "abc", "9223372036854775808"])(
    "rejects invalid page IDs safely: %s",
    (pageId) => {
      expect(
        saveStudioPageSchema.safeParse({ pageId, document: makeDocument() })
          .success
      ).toBe(false)
    }
  )

  it("rejects duplicate element IDs instead of creating ambiguous tree edits", () => {
    const doc = makeDocument()
    doc.elements.push(structuredClone(doc.elements[0]))
    expect(studioDocumentSchema.safeParse(doc).success).toBe(false)
  })

  it("rejects malformed numeric and content settings", () => {
    const doc = makeDocument()
    const invalid = doc as unknown as { elements: { settings: unknown }[] }
    invalid.elements[0].settings = { gap: "20", text: { malicious: true } }
    expect(studioDocumentSchema.safeParse(doc).success).toBe(false)
  })

  it("bounds deeply nested layouts before recursive validation", () => {
    const doc = makeDocument()
    let current = doc.elements[0]
    for (let i = 0; i < 40; i++) {
      const child = createStudioElement("div")
      current.elements.push(child)
      current = child
    }
    expect(studioDocumentSchema.safeParse(doc).success).toBe(false)
  })

  it("rejects oversized content", () => {
    const doc = makeDocument()
    doc.elements[0].settings.text = "x".repeat(500_001)
    expect(studioDocumentSchema.safeParse(doc).success).toBe(false)
  })
})

describe("column preset changes", () => {
  function flatten(elements: StudioElement[]): string[] {
    return elements.flatMap((el) => [el.id, ...flatten(el.elements)])
  }

  it("keeps content, nested column settings and loose widgets when reducing columns", () => {
    const container = createStudioContainerFromPreset("33_33_33")
    container.elements.forEach((column, index) => {
      column.settings.backgroundColor = ["red", "blue", "green"][index]
      column.elements.push(createStudioElement("heading"))
    })
    container.elements.push(createStudioElement("button"))
    const original = structuredClone(container)
    const next = applyStudioStructurePreset(container, "100")
    expect(flatten([next]).sort()).toEqual(flatten([container]).sort())
    expect(container).toEqual(original)
    expect(next.elements).toHaveLength(1)
    expect(next.elements[0].elements[1].settings.backgroundColor).toBe("blue")
  })

  it("expands a layout without losing existing columns", () => {
    const container = createStudioContainerFromPreset("100")
    const next = applyStudioStructurePreset(container, "50_50")
    expect(next.elements).toHaveLength(2)
    expect(next.elements[0].id).toBe(container.elements[0].id)
    expect(next.elements.map((el) => el.settings.widthPercent)).toEqual([
      50, 50,
    ])
  })

  it("uses a grid when a grid preset is requested", () => {
    const next = applyStudioStructurePreset(
      createStudioContainerFromPreset("100"),
      "grid_3"
    )
    expect(next.settings.containerType).toBe("grid")
    expect(next.settings.gridColumns).toBe(3)
  })
})
