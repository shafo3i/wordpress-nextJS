import { beforeEach, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import en from "@/templates/language/en.json"
import ar from "@/templates/language/ar.json"
const state = vi.hoisted(() => ({ locale: "ar", mode: "show", empty: false }))
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND")
  },
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`)
  },
}))
vi.mock("next/link", () => ({
  default: ({ children, ...props }: Record<string, unknown>) =>
    createElement("a", props, children as string),
}))
vi.mock("@/lib/site-theme", () => ({
  getFrontEndThemeContext: async () => ({
    locale: state.locale,
    defaultLocale: "ar",
    siteTitle: "Newsroom",
    direction: state.locale === "ar" ? "rtl" : "ltr",
    themeSlug: "newsroom",
    mods: {},
    dict: state.locale === "ar" ? ar : en,
    languages: [
      { code: "ar", isActive: state.locale === "ar" },
      { code: "en", isActive: state.locale === "en" },
    ],
  }),
}))
vi.mock("@/lib/widgets/db", () => ({ getAllWidgetAreas: async () => [] }))
vi.mock("@/components/site/header/site-header", () => ({
  SiteHeader: () => null,
}))
vi.mock("@/components/site/footer/site-footer", () => ({
  SiteFooter: () => null,
}))
vi.mock("@/components/site/theme-dynamic-styles", () => ({
  ThemeDynamicStyles: () => null,
}))
vi.mock("@/components/site/admin/public-admin-bar", () => ({
  PublicAdminBar: ({ children }: { children: string }) => children,
}))
const show = {
  id: "1",
  name: "Programme",
  slug: "programme",
  description: "<img src=x onerror=alert(1)>",
  presenters: "Team",
  website: "",
  artwork: "/demo/cover.png",
}
const episode = {
  id: "2",
  title: "Episode",
  slug: "episode",
  summary: "A summary",
  description: "<script>alert(1)</script>",
  date: "2026-01-01T00:00:00Z",
  audio: "/uploads/test.mp3",
  video: "",
  artwork: "",
  duration: 120,
  season: 1,
  episodeNumber: 1,
  transcript: "<iframe src=evil>",
  credits: "Team",
}
vi.mock("@/services/podcast-public.service", () => ({
  getPublicPodcastShow: async () => (state.empty ? null : show),
  getPublicPodcastEpisode: async () => (state.empty ? null : episode),
  listPublicPodcastShows: async () => ({
    items: state.empty ? [] : [show],
    page: 1,
    totalPages: 2,
  }),
  listPublicPodcastEpisodes: async () => ({
    items: state.empty ? [] : [episode],
    page: 1,
    totalPages: 2,
  }),
}))
import {
  PodcastPages,
  podcastPageMetadata,
} from "@/components/site/podcasts/podcast-pages"
beforeEach(() => {
  state.locale = "ar"
  state.empty = false
})
for (const locale of ["ar", "en"]) {
  it(`renders localized directory, show and episode safely (${locale})`, async () => {
    state.locale = locale
    const prefix = locale === "ar" ? "" : "/en"
    const directory = renderToStaticMarkup(
      await PodcastPages({ locale: locale === "ar" ? undefined : locale })
    )
    expect(directory).toContain(locale === "ar" ? "البودكاست" : "Podcasts")
    expect(directory).toContain(`href="${prefix}/podcasts/programme"`)
    const programme = renderToStaticMarkup(
      await PodcastPages({ segments: ["programme"] })
    )
    expect(programme).toContain(locale === "ar" ? 'dir="rtl"' : 'dir="ltr"')
    expect(programme).toContain("&lt;img src=x onerror=alert(1)&gt;")
    expect(programme).toContain(`href="${prefix}/podcasts/programme/episode"`)
    const detail = renderToStaticMarkup(
      await PodcastPages({ segments: ["programme", "episode"] })
    )
    expect(detail).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    expect(detail).not.toContain("<script>")
    expect(detail).toContain('src="/demo/cover.png"')
    expect(detail).toContain('preload="none"')
    expect(detail).toContain(locale === "ar" ? "النص المكتوب" : "Transcript")
  })
}
it("rejects unknown languages, invalid/deep paths and missing/draft records", async () => {
  await expect(PodcastPages({ locale: "xx" })).rejects.toThrow("NOT_FOUND")
  await expect(PodcastPages({ segments: ["a", "b", "c"] })).rejects.toThrow(
    "NOT_FOUND"
  )
  await expect(PodcastPages({ segments: ["../a"] })).rejects.toThrow(
    "NOT_FOUND"
  )
  state.empty = true
  await expect(PodcastPages({ segments: ["programme"] })).rejects.toThrow(
    "NOT_FOUND"
  )
})
it("shows a localized empty state and generates canonical metadata", async () => {
  state.empty = true
  expect(renderToStaticMarkup(await PodcastPages({}))).toContain(
    ar["site.podcasts.no_shows"]
  )
  state.empty = false
  expect(
    (await podcastPageMetadata(undefined, ["programme"])).alternates?.canonical
  ).toBe("/podcasts/programme")
  state.locale = "en"
  expect(
    (await podcastPageMetadata("en", ["programme", "episode"])).alternates
      ?.canonical
  ).toBe("/en/podcasts/programme/episode")
})
it("redirects prefixed default-language URLs to their canonical path with pagination", async () => {
  await expect(PodcastPages({ locale: "ar", page: "2" })).rejects.toThrow(
    "REDIRECT:/podcasts?page=2"
  )
})
