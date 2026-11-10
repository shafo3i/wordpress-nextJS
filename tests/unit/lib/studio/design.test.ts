import { describe, expect, it } from "vitest"
import { studioDocumentSchema } from "@/db/schema/cms-studio"
import { studioDesignSchema } from "@/db/schema/cms-studio-design"
import {
  effectiveStudioDesign,
  studioDesignPresentation,
  studioDesignForDevice,
} from "@/lib/studio/design"
import { createStudioElement } from "@/lib/studio/tree-helpers"
import {
  getStudioContentRequest,
  studioContentRequestKey,
} from "@/lib/studio/content"

describe("Studio design persistence", () => {
  it("preserves independent border visibility, including explicit false values", () => {
    const design = studioDesignSchema.parse({
      cardBorders: false,
      postDividers: true,
      sectionTitleBorder: false,
    })
    expect(
      studioDesignPresentation(JSON.parse(JSON.stringify(design))).attributes
    ).toMatchObject({
      "data-s-card-borders": "false",
      "data-s-post-dividers": "true",
      "data-s-section-title-border": "false",
    })
    expect(studioDesignPresentation({}).attributes).not.toHaveProperty(
      "data-s-card-borders"
    )
    expect(
      studioDesignSchema.safeParse({ postDividers: "false" }).success
    ).toBe(false)
  })
  it("uses the selected Studio preview device and preserves size units without mutating saved settings", () => {
    const design = studioDesignSchema.parse({
      typography: {
        title: {
          desktop: { size: 1.5, unit: "rem", color: "#333333" },
          mobile: { size: 18 },
        },
      },
    })
    const mobile = studioDesignPresentation(
      studioDesignForDevice(design, "mobile")
    )
    expect(mobile.style).toMatchObject({
      "--s-title-size-desktop": "18px",
      "--s-title-color-desktop": "#333333",
    })
    expect(mobile.attributes).not.toHaveProperty("data-s-title-size-mobile")
    expect(design.typography?.title?.desktop?.unit).toBe("rem")
  })
  it("retains typography, responsive overrides, square corners and zero spacing after save", () => {
    const element = createStudioElement("block_recent_posts")
    element.settings.design = {
      typography: {
        title: {
          desktop: { size: 24, unit: "px", weight: "700" },
          mobile: { size: 1.2, unit: "rem" },
        },
      },
      cardRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
      gap: 0,
    }
    const saved = studioDocumentSchema.parse(
      JSON.parse(
        JSON.stringify({
          version: "1.0",
          pageTemplate: "studio_full_width",
          elements: [element],
        })
      )
    )
    expect(saved.elements[0].settings.design).toEqual(element.settings.design)
    const output = studioDesignPresentation(saved.elements[0].settings.design)
    expect(output.style).toMatchObject({
      "--s-title-size-desktop": "24px",
      "--s-title-size-mobile": "1.2rem",
      "--s-card-radius": "0px 0px 0px 0px",
      "--s-gap": "0px",
    })
  })
  it("does not introduce desktop overrides for mobile-only settings", () => {
    const output = studioDesignPresentation({
      typography: { title: { mobile: { size: 18 } } },
    })
    expect(output.attributes).toHaveProperty("data-s-title-size-mobile")
    expect(output.attributes).not.toHaveProperty("data-s-title-size-desktop")
  })
  it("applies legacy zero radius and general typography to inner widget content", () => {
    const design = effectiveStudioDesign({
      borderRadius: 0,
      fontSize: 22,
      design: { typography: { title: { desktop: { size: 30 } } } },
    })
    expect(design.imageRadius?.topLeft).toBe(0)
    expect(design.typography?.title?.desktop?.size).toBe(30)
    expect(design.typography?.excerpt?.desktop?.size).toBe(22)
  })
  it.each([
    "url(https://example.test/x)",
    "red; background: url(x)",
    "expression(alert(1))",
  ])("rejects unsafe style values: %s", (color) => {
    expect(
      studioDesignSchema.safeParse({
        typography: { title: { desktop: { color } } },
      }).success
    ).toBe(false)
  })
  it("rejects invalid sizes and keeps old documents valid without design settings", () => {
    expect(studioDesignSchema.safeParse({ thumbnailWidth: -50 }).success).toBe(
      false
    )
    const element = createStudioElement("block_news_list")
    expect(
      studioDocumentSchema.safeParse({
        version: "1.0",
        pageTemplate: "studio_full_width",
        elements: [element],
      }).success
    ).toBe(true)
  })
  it("uses distinct locale-aware query keys for popular and recent content", () => {
    const popular = createStudioElement("block_popular_posts").settings
      .blockConfig!
    const recent =
      createStudioElement("block_recent_posts").settings.blockConfig!
    expect(getStudioContentRequest(popular, "ar").sort).toBe("popular")
    expect(
      studioContentRequestKey(getStudioContentRequest(popular, "ar"))
    ).not.toBe(studioContentRequestKey(getStudioContentRequest(recent, "ar")))
    expect(
      studioContentRequestKey(getStudioContentRequest(popular, "en"))
    ).not.toBe(studioContentRequestKey(getStudioContentRequest(popular, "ar")))
    expect(popular.title).toBe("")
  })
})
