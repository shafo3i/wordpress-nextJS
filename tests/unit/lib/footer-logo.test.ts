import { describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: React.ReactNode }) => createElement("a", props, children) }))
vi.mock("@/components/site/sidebar/sidebar-renderer", () => ({ SidebarWidgetRenderer: () => null }))
import { SiteFooter } from "@/components/site/footer/site-footer"
import { DEFAULT_THEME } from "@/components/site/utils"
describe("footer logo rendering", () => {
  it("uses the footer variant without replacing the header asset", () => {
    const theme = { ...DEFAULT_THEME, mods: { ...DEFAULT_THEME.mods, logoUrl: "/uploads/header.webp", footerLogoUrl: "/uploads/footer.webp" } }
    const html = renderToStaticMarkup(createElement(SiteFooter, { theme }))
    expect(html).toContain('src="/uploads/footer.webp"')
    expect(html).not.toContain('src="/uploads/header.webp"')
    expect(theme.mods.logoUrl).toBe("/uploads/header.webp")
  })
  it("falls back to the header logo when the footer selection is removed", () => {
    const theme = { ...DEFAULT_THEME, mods: { ...DEFAULT_THEME.mods, logoUrl: "/uploads/header.webp", footerLogoUrl: "" } }
    expect(renderToStaticMarkup(createElement(SiteFooter, { theme }))).toContain('src="/uploads/header.webp"')
  })
})
