import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { FONTS, getLocalFontStylesheets } from "@/lib/customizer/fonts"
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles"

describe("self-hosted font catalog", () => {
  it("only emits deduplicated local stylesheets for known fonts", () => {
    expect(
      getLocalFontStylesheets([
        "inter",
        "cairo",
        "inter",
        "georgia",
        "unknown",
        "../../secret",
      ])
    ).toEqual(["/fonts/inter/font.css", "/fonts/cairo/font.css"])
  })
  it.each(FONTS.filter((font) => font.id !== "georgia"))(
    "ships real WOFF2 assets and a licence for $id",
    (font) => {
      const cssPath = resolve(
        "public",
        getLocalFontStylesheets([font.id])[0].slice(1)
      )
      const css = readFileSync(cssPath, "utf8")
      expect(css).toContain("font-display: swap")
      expect(css).not.toMatch(/https?:|@import/)
      const sources = [...css.matchAll(/url\((?:['"])?([^)'"\s]+)/g)]
      expect(sources.length).toBeGreaterThan(0)
      for (const [, name] of sources) {
        const file = resolve(cssPath, "..", name)
        expect(readFileSync(file).subarray(0, 4).toString()).toBe("wOF2")
      }
      expect(existsSync(resolve(cssPath, "..", "OFL.txt"))).toBe(true)
    }
  )
  it("renders theme typography without external font stylesheets", () => {
    const html = renderToStaticMarkup(
      createElement(ThemeDynamicStyles, {
        mods: {
          headingFontFamily: "inter",
          bodyFontFamily: "inter",
          arabicHeadingFontFamily: "cairo",
          arabicBodyFontFamily: "cairo",
        },
      })
    )
    expect(html).not.toContain("fonts.googleapis.com")
    expect(html).not.toContain("fonts.gstatic.com")
    expect(html.match(/href="\/fonts\/inter\/font.css"/g)).toHaveLength(1)
    expect(html.match(/href="\/fonts\/cairo\/font.css"/g)).toHaveLength(1)
  })
  it("does not fetch fonts during the Next.js build", () => {
    expect(readFileSync("app/layout.tsx", "utf8")).not.toContain(
      "next/font/google"
    )
  })
})
