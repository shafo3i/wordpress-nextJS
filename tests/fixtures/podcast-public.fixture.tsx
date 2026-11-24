import { createRoot } from "react-dom/client"
import { PodcastPages } from "../../components/site/podcasts/podcast-pages"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
import demoShow from "../../templates/seed/podcast-ar-demo.json"
import demoEpisode from "../../templates/seed/podcast-ar-episode-demo.json"
let root: ReturnType<typeof createRoot>
export async function render(
  locale: "ar" | "en",
  mode: "directory" | "show" | "episode"
) {
  const globals = window as unknown as {
    podcastTheme: unknown
    podcastShow: unknown
    podcastEpisode: unknown
  }
  globals.podcastTheme = {
    locale,
    defaultLocale: "ar",
    direction: locale === "ar" ? "rtl" : "ltr",
    siteTitle: "Newsroom",
    themeSlug: "newsroom",
    mods: { archiveContentWidth: 1280 },
    dict: locale === "ar" ? ar : en,
    languages: [
      { code: "ar", isActive: locale === "ar" },
      { code: "en", isActive: locale === "en" },
    ],
  }
  globals.podcastShow = {
    id: "1",
    slug: demoShow.slug,
    name: locale === "ar" ? demoShow.name : "Voices from the newsroom",
    description:
      locale === "ar"
        ? demoShow.description
        : "Conversations about culture, community and the stories that bring us together.",
    presenters: demoShow.presenters,
    website: "",
    artwork: "/demo/podcasts/arabic-demo-cover.png",
  }
  globals.podcastEpisode = {
    id: "2",
    slug: demoEpisode.slug,
    title: locale === "ar" ? demoEpisode.title : "Why we tell our stories",
    summary: demoEpisode.summary,
    description: demoEpisode.description,
    credits: demoEpisode.credits,
    transcript: "Transcript",
    date: "2026-01-01T00:00:00Z",
    audio: "/uploads/test.mp3",
    video: "",
    artwork: "",
    duration: 900,
    season: 1,
    episodeNumber: 1,
  }
  root ??= createRoot(document.getElementById("fixture")!)
  root.render(
    await PodcastPages({
      segments:
        mode === "directory"
          ? []
          : mode === "show"
            ? [demoShow.slug]
            : [demoShow.slug, demoEpisode.slug],
    })
  )
}
