import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { EpisodeForm } from "../../app/(admin)/admincp/podcasts/episodes/_components/episode-form"
import { EpisodeTable } from "../../app/(admin)/admincp/podcasts/episodes/_components/episode-table"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
import { podcastEpisodeSchema } from "../../db/schema/cms-podcast-episodes"
let root: ReturnType<typeof createRoot>
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
export function render(locale: "en" | "ar", edit = false) {
  root ??= createRoot(document.getElementById("fixture")!)
  const dict = locale === "en" ? en : ar
  const languages = [{ code: "en", name: "English", nativeName: "English" }, { code: "ar", name: "Arabic", nativeName: "العربية" }]
  const episode = edit ? { ...podcastEpisodeSchema.parse({ id: "11", postTitle: "Stored episode", languageCode: locale, showId: "42", audioId: "81", audioUrl: "/uploads/stored.mp3" }), id: "11", showName: "Show on next page", artworkUrl: "" } : undefined
  root.render(<QueryClientProvider client={queryClient}><main key={`${locale}-${edit}`} dir={locale === "ar" ? "rtl" : "ltr"}><EpisodeForm episode={episode} dict={dict} languages={languages} defaultLanguage={locale} /><EpisodeTable items={[{ id: "9", postTitle: "<img src=x onerror=alert(1)>", status: "draft", languageCode: locale, date: "2026-11-24T12:00:00.000Z" }]} page={1} total={25} language={locale} status="draft" search="test" dict={dict} /></main></QueryClientProvider>)
}
