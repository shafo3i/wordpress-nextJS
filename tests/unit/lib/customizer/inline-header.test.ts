import { describe, expect, it } from "vitest"
import { sanitizeMods, isShown } from "@/lib/customizer/resolve"
import { headerSection } from "@/lib/customizer/core-sections/header"
import { localizeSetting } from "@/lib/customizer/i18n"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"

describe("compact inline news header settings", () => {
  it("saves the new layout and border settings through the existing sanitizer", () => {
    expect(sanitizeMods("pressforge-broadsheet", { headerLayout: "inline-news", inlineHeaderBorderStyle: "none", inlineHeaderBorderWidth: 3 })).toMatchObject({ headerLayout: "inline-news", inlineHeaderBorderStyle: "none", inlineHeaderBorderWidth: 3 })
    expect(sanitizeMods("pressforge-broadsheet", { inlineHeaderBorderStyle: "solid;background:red", inlineHeaderBorderWidth: 100 })).toEqual({ inlineHeaderBorderWidth: 6 })
  })
  it("localizes controls and exposes compact borders only for the new layout", () => {
    const settings = headerSection.groups.flatMap(group => group.settings)
    for (const id of ["headerLayout", "inlineHeaderBorderStyle", "inlineHeaderBorderWidth"]) {
      const setting = settings.find(setting => setting.id === id)!
      for (const dict of [en, ar]) {
        const localized = localizeSetting(setting, dict)
        expect(localized.label).not.toBe("")
        for (const option of localized.options || []) expect(option.label).not.toBe("")
      }
    }
    const border = settings.find(setting => setting.id === "inlineHeaderBorderStyle")!
    expect(isShown(border.showIf, { headerLayout: "classic" })).toBe(false)
    expect(isShown(border.showIf, { headerLayout: "inline-news" })).toBe(true)
  })
})
