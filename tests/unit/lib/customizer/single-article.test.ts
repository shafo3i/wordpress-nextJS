import { describe, expect, it } from "vitest"
import { sanitizeMods } from "@/lib/customizer/resolve"
import { singleSection } from "@/lib/customizer/core-sections/single"
import { localizeSetting } from "@/lib/customizer/i18n"
import { buildThemeCss } from "@/lib/customizer/css"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"
describe("single article presentation controls", () => {
  it("preserves zero radii and explicit newsletter/border/shadow choices", () => {
    expect(sanitizeMods("pressforge-broadsheet", { singleShowNewsletter: false, singleNewsletterBorder: false, singleNewsletterRadius: 0, singleContentRadius: 0, singleImageRadius: 0, singleContentShadow: false, singleNewsletterShadow: false })).toEqual({ singleShowNewsletter: false, singleNewsletterBorder: false, singleNewsletterRadius: 0, singleContentRadius: 0, singleImageRadius: 0, singleContentShadow: false, singleNewsletterShadow: false })
  })
  it("localizes every added control and scopes newsletter styling to article placement", () => {
    const ids = ["singleShowNewsletter", "singleNewsletterBorder", "singleNewsletterRadius", "singleContentRadius", "singleImageRadius", "singleContentShadow", "singleNewsletterShadow"]
    for (const id of ids) {
      const setting = singleSection.groups.flatMap(group => group.settings).find(setting => setting.id === id)
      expect(setting).toBeDefined()
      for (const dict of [en, ar]) expect(localizeSetting(setting!, dict).label).not.toBe("")
    }
    const css = buildThemeCss({ singleNewsletterBorder: false, singleNewsletterShadow: false })
    expect(css).toContain('[data-single-article] [data-newsletter-source="article_footer"]')
    expect(css).toContain("border-width: 0 !important")
  })
})
