import { describe, expect, it } from "vitest"
import { homepageDocument } from "@/scripts/wordpress_migration/homepages"
import type { StudioElement } from "@/lib/studio/types"

describe("imported homepage starter layouts", () => {
  for (const locale of ["en", "ar"])
    it(`creates a valid ${locale} layout without demo content`, () => {
      const doc = homepageDocument(locale, [
        { id: "15", slug: "source-category" },
      ])
      const widgets: StudioElement[] = []
      const visit = (elements: StudioElement[]) =>
        elements.forEach((element) => {
          if (element.settings.blockConfig) widgets.push(element)
          visit(element.elements || [])
        })
      visit(doc.elements)
      expect(widgets.length).toBeGreaterThanOrEqual(6)
      expect(widgets.every((w) => w.settings.blockConfig?.title === "")).toBe(
        true
      )
      expect(
        widgets.every((w) => w.settings.blockConfig?.contentLocale === locale)
      ).toBe(true)
      expect(new Set(widgets.map((w) => w.id)).size).toBe(widgets.length)
      expect(doc.settings?.hideTitle).toBe(true)
    })
})
