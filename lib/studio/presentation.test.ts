import { describe, expect, it } from "vitest"
import { buildElementInlineStyles } from "@/components/site/studio/studio-styles"
import { getActiveNavigationId } from "@/components/site/header/navigation"
import { createStudioElement } from "./tree-helpers"
import { studioDocumentSchema } from "@/db/schema/cms-studio"

describe("Studio presentation", () => {
  it("keeps ticker surface styles and spacing when a document is saved", () => {
    const element = createStudioElement("block_breaking_ticker")
    Object.assign(element.settings, {
      backgroundColor: "#102030",
      textColor: "#ffffff",
      tickerLabelColor: "#ff0000",
      paddingTop: 0,
      paddingLeft: 30,
      marginTop: -8,
      fontSize: 18,
      fontWeight: "500",
      borderStyle: "none",
    })
    const saved = studioDocumentSchema.parse(
      JSON.parse(
        JSON.stringify({
          version: "1.0",
          pageTemplate: "studio_full_width",
          elements: [element],
        })
      )
    )
    const style = buildElementInlineStyles(saved.elements[0]) as Record<
      string,
      unknown
    >
    expect(style["--studio-ticker-background-color"]).toBe("#102030")
    expect(style["--studio-ticker-padding-top"]).toBe("0px")
    expect(style["--studio-ticker-padding-left"]).toBe("30px")
    expect(style["--studio-ticker-font-size"]).toBe("18px")
    expect(style["--studio-ticker-label-color"]).toBe("#ff0000")
    expect(style["--studio-ticker-border-style"]).toBe("none")
    expect(style.marginTop).toBe("-8px")
  })
  it("marks the current navigation destination rather than the first item", () => {
    const items = [
      { id: "home", title: "Home", url: "/", order: 1 },
      { id: "desk", title: "Desk", url: "/ar/business", order: 2 },
      { id: "detail", title: "Detail", url: "/ar/business/report/", order: 3 },
      {
        id: "external",
        title: "External",
        url: "//external.test/ar/business/report",
        order: 4,
      },
    ]
    expect(getActiveNavigationId(items, "/ar/business/report")).toBe("detail")
    expect(getActiveNavigationId(items, "/ar/business/other")).toBe("desk")
    expect(getActiveNavigationId(items, "/unmatched")).toBeUndefined()
    expect(getActiveNavigationId(items, "/")).toBe("home")
  })
})
