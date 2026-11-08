import { describe, expect, it } from "vitest"
import { themeLayoutSchema } from "@/db/schema/cms-theme-layout"
import {
  getHomepageLayoutSettings,
  getHomepageLayoutStyle,
  mergeHomepageLayout,
} from "./homepage-layout"
import type { HomepageSettings } from "./homepage-types"

const original = {
  layout: "full_width",
  blocks: [{ id: "story", title: "Existing", order: 8 }],
  sections: [
    {
      id: "section",
      rows: [
        {
          id: "row",
          columns: [
            { id: "column", items: [{ type: "widget", widgetId: "recent" }] },
          ],
        },
      ],
    },
  ],
  futureField: { enabled: true },
}
const patch = {
  layout: "left_sidebar",
  sidebarWidth: 300,
  columnGap: 24,
  stickySidebars: false,
} as const

describe("theme layout settings", () => {
  it("preserves existing builder content and future fields exactly when saving or resetting layout", () => {
    const result = mergeHomepageLayout(JSON.stringify(original), patch, {
      layout: "right_sidebar",
      blocks: [],
    })
    expect(result.blocks).toEqual(original.blocks)
    expect(result.sections).toEqual(original.sections)
    expect(result.futureField).toEqual(original.futureField)
    expect(result.layout).toBe("left_sidebar")
    const reset = mergeHomepageLayout(
      JSON.stringify(result),
      getHomepageLayoutSettings({ layout: "full_width" }),
      { layout: "right_sidebar", blocks: [] }
    )
    expect(reset.blocks).toEqual(original.blocks)
    expect(reset.sections).toEqual(original.sections)
    expect(reset.sidebarWidth).toBeNull()
  })
  it("rejects builder payloads and out-of-range or non-finite settings", () => {
    for (const invalid of [
      { ...patch, sections: [] },
      { ...patch, sidebarWidth: 0 },
      { ...patch, columnGap: 81 },
      { ...patch, columnGap: NaN },
      { ...patch, layout: "invalid" },
    ])
      expect(themeLayoutSchema.safeParse(invalid).success).toBe(false)
  })
  it("keeps old templates' widths and spacing unless explicitly overridden", () => {
    expect(getHomepageLayoutStyle({ layout: "full_width" })).toEqual({
      "--feed-sidebar-position": "sticky",
    })
    expect(
      getHomepageLayoutStyle({ ...patch, blocks: [], columnGap: 0 })
    ).toEqual({
      "--feed-sidebar-width": "300px",
      "--feed-column-gap": "0px",
      "--feed-sidebar-position": "static",
    })
  })
  it("does not render invalid saved values as CSS", () => {
    expect(
      getHomepageLayoutStyle({
        sidebarWidth: "url(unsafe)",
        columnGap: -10,
      } as unknown as HomepageSettings)
    ).toEqual({ "--feed-sidebar-position": "sticky" })
  })
  it("recovers malformed storage from the existing fallback without losing fallback content", () => {
    const fallback = { layout: "right_sidebar", blocks: [] } as HomepageSettings
    expect(mergeHomepageLayout("invalid", patch, fallback)).toEqual({
      ...fallback,
      ...patch,
    })
  })
})
