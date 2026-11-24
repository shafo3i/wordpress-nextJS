import { beforeEach, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"
const state = vi.hoisted(() => ({ language: "en" as string | undefined }))
vi.mock("@/lib/authMIddleware", () => ({ verifyAdminOrEditor: vi.fn() }))
vi.mock("@/components/admin/admin-shell", () => ({
  AdminShell: ({ children }: { children: string }) => children,
  getAdminLanguageContext: async () => ({
    dict: ar,
    direction: "rtl",
    allLanguages: [],
  }),
}))
vi.mock("@/services/language.service", () => ({
  getDefaultLanguage: async () => ({ code: "ar" }),
  getTranslations: async (code: string) => (code === "ar" ? ar : en),
}))
vi.mock("@/app/(admin)/admincp/menus/query", () => ({
  getMenus: async () => [{ id: "1" }],
  getMenu: async () => ({
    id: "1",
    language: state.language,
    items: [],
    locations: [],
  }),
  getMenuAvailableItems: async () => ({ pages: [], categories: [], posts: [] }),
}))
vi.mock("@/app/(admin)/admincp/menus/_components", () => ({
  MenuSelectorBar: () => null,
  MenuManagerShell: ({
    podcastDirectory,
  }: {
    podcastDirectory: { title: string; url: string }
  }) =>
    createElement("a", { href: podcastDirectory.url }, podcastDirectory.title),
}))
import MenusPage from "@/app/(admin)/admincp/menus/page"
beforeEach(() => {
  state.language = "en"
})
it("offers an English podcast directory for an English menu even with Arabic admin UI", async () => {
  const html = renderToStaticMarkup(
    await MenusPage({ searchParams: Promise.resolve({ menu: "1" }) })
  )
  expect(html).toContain('href="/en/podcasts">Podcasts</a>')
})
it("uses the unprefixed default-language podcast URL for Arabic menus", async () => {
  state.language = "ar"
  const html = renderToStaticMarkup(
    await MenusPage({ searchParams: Promise.resolve({ menu: "1" }) })
  )
  expect(html).toContain('href="/podcasts">البودكاست</a>')
})
it("uses the site default language for unassigned menus", async () => {
  state.language = undefined
  const html = renderToStaticMarkup(
    await MenusPage({ searchParams: Promise.resolve({ menu: "1" }) })
  )
  expect(html).toContain('href="/podcasts">البودكاست</a>')
})
