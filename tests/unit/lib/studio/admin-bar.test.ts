import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PublicAdminBar } from "@/components/site/admin/public-admin-bar"
import en from "@/templates/language/en.json"

const mocks = vi.hoisted(() => ({ session: vi.fn(), language: vi.fn() }))
vi.mock("@/auth", () => ({ auth: { api: { getSession: mocks.session } } }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/components/admin/admin-shell", () => ({
  getAdminLanguageContext: mocks.language,
}))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.language.mockResolvedValue({ dict: en, direction: "ltr" })
})
describe("Homepage admin toolbar", () => {
  it.each([null, { user: { role: "user" } }])(
    "renders no admin markup for a visitor without an editor role",
    async (session) => {
      mocks.session.mockResolvedValue(session)
      const node = await PublicAdminBar({
        children: createElement("main", null, "Public content"),
        pageId: "122",
        siteTitle: "Site",
      })
      expect(
        renderToStaticMarkup(createElement("div", null, node))
      ).not.toContain("/admincp")
      expect(mocks.language).not.toHaveBeenCalled()
    }
  )
  it.each(["admin", "editor"])(
    "shows the actual translated page links to %s",
    async (role) => {
      mocks.session.mockResolvedValue({ user: { role, name: "Editor" } })
      const node = await PublicAdminBar({
        children: createElement("main"),
        pageId: "122",
        siteTitle: "Site",
      })
      const html = renderToStaticMarkup(createElement("div", null, node))
      if (role === "admin") {
        expect(html).toContain('href="/admincp/studio/122"')
        expect(html).toContain('href="/admincp/pages/122/edit"')
      } else {
        expect(html).toContain('href="/admincp/posts"')
        expect(html).not.toContain('/admincp/studio/')
        expect(html).not.toContain('/admincp/pages/')
      }
      expect(html).toContain("data-public-admin-bar")
    }
  )
})
