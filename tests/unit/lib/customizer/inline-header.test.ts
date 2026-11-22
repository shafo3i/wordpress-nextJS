import { describe, expect, it } from "vitest"
import { sanitizeMods, isShown } from "@/lib/customizer/resolve"
import { headerSection } from "@/lib/customizer/core-sections/header"
import { localizeSetting } from "@/lib/customizer/i18n"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"
import { navigationSection } from "@/lib/customizer/core-sections/navigation"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { SectionPanel } from "@/app/(admin)/admincp/customize/_components/section-panel"

describe("compact inline news header settings", () => {
  it("saves the new layout and border settings through the existing sanitizer", () => {
    expect(sanitizeMods("pressforge-broadsheet", { headerLayout: "inline-news", inlineHeaderBorderStyle: "none", inlineHeaderBorderWidth: 3 })).toMatchObject({ headerLayout: "inline-news", inlineHeaderBorderStyle: "none", inlineHeaderBorderWidth: 3 })
    expect(sanitizeMods("pressforge-broadsheet", { inlineHeaderBorderStyle: "solid;background:red", inlineHeaderBorderWidth: 100 })).toEqual({ inlineHeaderBorderWidth: 6 })
  })
  it("localizes controls and exposes compact borders only for the new layout", () => {
    const settings = headerSection.groups.flatMap(group => group.settings)
    for (const id of ["headerLayout", "inlineHeaderBorderStyle", "inlineHeaderBorderWidth", "inlineTitleLanguages"]) {
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
  it("saves language choices including new languages and rejects malformed values", () => {
    expect(sanitizeMods("pressforge-broadsheet", { inlineTitleLanguages: "en,fr,de,pt-BR,en" })).toEqual({ inlineTitleLanguages: "en,fr,de,pt-BR" })
    for (const value of ["<script>", ["en"], "en,ar;evil", "en," , "a".repeat(2001)]) {
      expect(sanitizeMods("pressforge-broadsheet", { inlineTitleLanguages: value })).toEqual({})
    }
  })
  it("validates and translates each independent menu interaction choice", () => {
    for (const setting of navigationSection.groups.flatMap(group => group.settings).filter(setting => ["navHoverStyle", "navActiveStyle"].includes(setting.id))) {
      for (const dict of [en, ar]) {
        const translated = localizeSetting(setting, dict)
        expect(translated.label).not.toBe("")
        for (const option of translated.options!) {
          expect(option.label).not.toBe("")
          expect(sanitizeMods("pressforge-broadsheet", { [setting.id]: option.value })).toEqual({ [setting.id]: option.value })
        }
      }
      expect(sanitizeMods("pressforge-broadsheet", { [setting.id]: "invalid" })).toEqual({})
    }
  })
  it("lists configured languages in the Customizer, including languages added later", () => {
    const settings = headerSection.groups.flatMap(group => group.settings)
    const html = renderToStaticMarkup(createElement(SectionPanel, {
      section: headerSection, open: true, onToggle: () => {},
      values: { headerLayout: "inline-news", inlineTitleLanguages: "fr" }, defaults: {},
      settingsById: new Map(settings.map(setting => [setting.id, setting])), palettes: [],
      onChange: () => {}, onApplyPalette: () => {}, dict: en,
      languages: [{ code: "en", name: "English" }, { code: "fr", name: "French", nativeName: "Français" }],
    }))
    expect(html).toContain("Français")
    expect(html.match(/type="checkbox"/g)?.length).toBeGreaterThanOrEqual(2)
    expect(html).toContain('type="checkbox" checked=""')
  })
})
