import { describe, expect, it } from "vitest"
import { archivePageNumbers, getArchiveSettings } from "./archive"
import { sanitizeMods } from "./resolve"
import { archiveSection } from "./core-sections/archive"
import { localizeSetting } from "./i18n"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"

describe("category archive settings", () => {
  it("defaults to compact cards and preserves explicit zero/false values", () => {
    const settings = getArchiveSettings({
      archiveRadius: 0,
      archiveImageRadius: 0,
      archiveFeatured: false,
      archiveExcerptLength: 0,
    })
    expect(settings.archiveLayout).toBe("list")
    expect(settings.archiveRadius).toBe(0)
    expect(settings.archiveImageRadius).toBe(0)
    expect(settings.archiveExcerptLength).toBe(0)
    expect(settings.archiveFeatured).toBe(false)
  })
  it("bounds legacy/untrusted values and sanitizes saves through the registry", () => {
    expect(
      getArchiveSettings({ archiveImageHeight: 99999, archiveTitleSize: NaN })
        .archiveImageHeight
    ).toBe(240)
    expect(getArchiveSettings({ archiveTitleSize: NaN }).archiveTitleSize).toBe(
      20
    )
    const saved = sanitizeMods("pressforge-broadsheet", {
      archiveRadius: -100,
      archiveColumns: "4",
      archiveLayout: "injected",
    })
    expect(saved.archiveRadius).toBe(0)
    expect(saved.archiveColumns).toBe(4)
    expect(saved.archiveLayout).toBeUndefined()
  })
  it("provides translated labels and options for both languages", () => {
    for (const dict of [en, ar])
      for (const setting of archiveSection.groups.flatMap((g) => g.settings)) {
        const localized = localizeSetting(setting, dict)
        expect(localized.label.length).toBeGreaterThan(0)
        for (const option of localized.options || [])
          expect(option.label.length).toBeGreaterThan(0)
      }
  })
  it("keeps pagination bounded for large archives", () => {
    const pages = archivePageNumbers(1000, 500)
    expect(pages).toEqual([1, null, 498, 499, 500, 501, 502, null, 1000])
    expect(archivePageNumbers(3, 1)).toEqual([1, 2, 3])
  })
})
