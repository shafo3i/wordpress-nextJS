import { describe, it, expect } from "vitest"
import {
  studioContainerWidthMode,
  studioContainerMaxWidth,
} from "@/lib/studio/container-width"
import { buildThemeCss } from "@/lib/customizer/css"
import { sanitizeMods } from "@/lib/customizer/resolve"
import { createStudioElement } from "@/lib/studio/tree-helpers"
import { studioSettingsSchema } from "@/db/schema/cms-studio"
describe("shared site sizing", () => {
  it("inherits site width for new containers and the old stamped default", () => {
    expect(
      studioContainerWidthMode(createStudioElement("container").settings)
    ).toBe("inherit")
    expect(
      studioContainerMaxWidth({ contentWidth: "boxed", maxWidth: 1280 })
    ).toBe("var(--theme-container-width, 1280px)")
  })
  it("preserves explicit custom widths including 1280 and full-width sections", () => {
    expect(
      studioContainerMaxWidth({
        contentWidth: "boxed",
        maxWidth: 1280,
        customWidth: true,
      })
    ).toBe("1280px")
    expect(
      studioContainerMaxWidth({ contentWidth: "boxed", maxWidth: 960 })
    ).toBe("960px")
    expect(
      studioContainerMaxWidth({ contentWidth: "full", maxWidth: 960 })
    ).toBeUndefined()
    expect(
      studioSettingsSchema.parse({ contentWidth: "inherit" }).contentWidth
    ).toBe("inherit")
  })
  it.each(["1600", "100%"] as const)(
    "persists and emits the %s preset without an invalid unit",
    (width) => {
      const mods = sanitizeMods("pressforge-broadsheet", {
        containerWidth: width,
      })
      expect(mods.containerWidth).toBe(width)
      expect(buildThemeCss(mods)).toContain(
        `--theme-container-width: ${width === "100%" ? "100%" : "1600px"};`
      )
      expect(buildThemeCss(mods)).not.toContain("100%px")
    }
  )
})
