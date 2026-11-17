import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { FrontEndThemeContext } from "@/lib/site-theme"
// Simulate a stale client registry during a theme switch / development refresh.
vi.mock("@/themes/registry", async importOriginal => ({
  ...await importOriginal<typeof import("@/themes/registry")>(),
  getThemeModule: () => ({ supports: { sectionStyle: "classic" } }),
}))
vi.mock("@/components/site/templates/news-home", () => ({
  NewsHome: ({ theme }: { theme: FrontEndThemeContext }) => createElement("output", { "data-section-style": theme.sectionStyle }),
}))
vi.mock("@/components/site/templates/post-template", () => ({ PostTemplate: () => null }))
vi.mock("@/components/site/templates/category-template", () => ({ CategoryTemplate: () => null }))
import { PreviewHost } from "@/app/customize-preview/preview-host"
import { DEFAULT_THEME } from "@/components/site/utils"
describe("Customizer selected theme snapshot", () => {
  it("uses the server's selected theme style instead of recomputing it from the client registry", () => {
    const html = renderToStaticMarkup(createElement(PreviewHost, {
      themeSlug: "pressforge-newsroom", sectionStyle: "minimal",
      baseTheme: { ...DEFAULT_THEME, sectionStyle: "classic" },
      initialState: { mods: {}, siteTitle: "", siteTagline: "", page: "home" },
      posts: [], categoryArchive: null, categorySidebar: [],
      homepageSettings: { layout: "full_width", blocks: [] }, primarySidebar: [], secondarySidebar: [],
      footerWidgets: { col1: [], col2: [], col3: [] },
    }))
    expect(html).toContain('data-section-style="minimal"')
    expect(html).not.toContain('data-section-style="classic"')
  })
})
