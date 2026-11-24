import { createRoot } from "react-dom/client"
import { ShowForm, ShowFilter, ShowTable } from "../../app/(admin)/admincp/podcasts/shows/_components"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
import type { SelectPodcastShow } from "../../db/schema/cms-podcasts"
let root: ReturnType<typeof createRoot>
const languages = [{ code: "en", name: "English", nativeName: "English" }, { code: "ar", name: "Arabic", nativeName: "العربية" }]
export function render(locale: "en" | "ar", edit = false) {
  root ??= createRoot(document.getElementById("fixture")!)
  const dict = locale === "en" ? en : ar
  const show: SelectPodcastShow = { id: "1", taxonomyId: "2", name: "<img src=x onerror=alert(1)>", slug: "newsroom", languageCode: locale, description: "Programme description", presenters: "Presenter", website: "", status: "draft", artworkId: "" }
  root.render(<main dir={locale === "ar" ? "rtl" : "ltr"}><ShowFilter search="" language="all" languages={languages} dict={dict} /><ShowForm key={`${locale}-${edit}`} show={edit ? show : undefined} languages={languages} dict={dict} /><ShowTable items={[show]} page={1} total={25} language={locale} search="news" dict={dict} /></main>)
}
