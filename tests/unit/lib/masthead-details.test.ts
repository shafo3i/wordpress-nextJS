import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
vi.mock("next/navigation", () => ({ usePathname: () => "/" }))
vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode }) =>
    createElement("a", props, children),
}))
import { SiteHeader } from "@/components/site/header/site-header"
import { DEFAULT_THEME } from "@/components/site/utils"
import { sanitizeMods } from "@/lib/customizer/resolve"
import type { ThemeMods } from "@/lib/themes/types"
const theme = {
  ...DEFAULT_THEME,
  siteTitle: "Publication",
  siteTagline: "Independent reporting",
  headerDate: "2026-11-19T12:00:00.000Z",
  timeZone: "UTC",
  primaryNav: [{ id: "home", title: "Home", url: "/", order: 0 }],
  languages: [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      url: "/en",
      isActive: true,
      direction: "ltr",
      isDefault: false,
    },
    {
      code: "ar",
      name: "Arabic",
      nativeName: "العربية",
      url: "/",
      isActive: false,
      direction: "rtl",
      isDefault: true,
    },
  ],
}
const render = (mods: ThemeMods = {}) =>
  renderToStaticMarkup(
    createElement(SiteHeader, {
      theme: {
        ...theme,
        mods: {
          headerLayout: "classic",
          socialFacebook: "https://example.test/facebook",
          ...mods,
        },
      },
    })
  )
describe("balanced masthead", () => {
  it("uses site identity, server date and configured utilities without duplicating them", () => {
    const html = render()
    expect(html).toContain("data-masthead-publication")
    expect(html).toContain('dateTime="2026-11-19T12:00:00.000Z"')
    expect(html.match(/Independent reporting/g)).toHaveLength(1)
    expect(html.match(/https:\/\/example.test\/facebook/g)).toHaveLength(1)
    expect(html.match(/href="\/en"/g)).toHaveLength(1)
    expect(html).not.toMatch(/register|weather|cms-admin/)
  })
  it("saves real controls and can hide the statement, languages, date and socials", () => {
    expect(
      sanitizeMods("pressforge-broadsheet", {
        showMastheadDetails: false,
        showMastheadStatement: false,
        showMastheadLanguages: false,
      })
    ).toEqual({
      showMastheadDetails: false,
      showMastheadStatement: false,
      showMastheadLanguages: false,
    })
    const html = render({
      showMastheadStatement: false,
      showMastheadLanguages: false,
      showDateInHeader: false,
      showSocialIconsInHeader: false,
    })
    expect(html).not.toContain("Independent reporting")
    expect(html).not.toContain("/en")
    expect(html).not.toContain("<time")
    expect(html).not.toContain("facebook")
  })
  it("retains the compact inline header and permits the old logo-only masthead", () => {
    expect(render({ headerLayout: "inline-news" })).not.toContain(
      "data-masthead-publication"
    )
    expect(render({ showMastheadDetails: false })).not.toContain(
      "data-masthead-publication"
    )
  })
})
