import { createRoot } from "react-dom/client"
import { PodcastEpisodePlayer } from "../../components/site/podcasts/episode-player"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
let root: ReturnType<typeof createRoot>
export function render(locale: "en" | "ar", unsafe = false) {
  root ??= createRoot(document.getElementById("fixture")!)
  root.render(
    <div dir={locale === "ar" ? "rtl" : "ltr"}>
      <PodcastEpisodePlayer
        key={`${locale}-${unsafe}`}
        audio={unsafe ? "javascript:alert(1)" : "/uploads/test.mp3"}
        video={unsafe ? "https://evil.test/embed" : "/uploads/test.mp4"}
        title="Episode"
        dict={locale === "ar" ? ar : en}
      />
    </div>
  )
}
