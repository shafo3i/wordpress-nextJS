import { createRoot } from "react-dom/client"
import { SiteHeader } from "../../components/site/header/site-header"
import { DEFAULT_THEME } from "../../components/site/utils"
import { getThemeDefaultMods } from "../../lib/customizer/resolve"
import { buildThemeCss } from "../../lib/customizer/css"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
let root: ReturnType<typeof createRoot>
export function render(
  locale: "en" | "ar",
  layout: "classic" | "magazine" | "minimal" | "centered",
  showTopBar = true
) {
  root ||= createRoot(document.getElementById("fixture")!)
  const mods = {
    ...getThemeDefaultMods("pressforge-broadsheet"),
    headerLayout: layout,
    showTopBar,
    showSearchInNav: true,
    socialFacebook: "https://example.test/facebook",
    socialX: "https://example.test/x",
    socialInstagram: "https://example.test/instagram",
    socialYoutube: "https://example.test/youtube",
    socialLinkedin: "https://example.test/linkedin",
  }
  let css = document.getElementById("theme-css")
  if (!css) {
    css = document.createElement("style")
    css.id = "theme-css"
    document.head.append(css)
  }
  css.textContent = buildThemeCss(mods)
  const title =
    locale === "en"
      ? "News and reports from the newsroom"
      : "أخبار وتقارير من غرفة الأخبار"
  root.render(
    <SiteHeader
      key={`${locale}:${layout}:${showTopBar}`}
      theme={{
        ...DEFAULT_THEME,
        mods,
        headerLayout: layout,
        dict: locale === "ar" ? ar : en,
        siteTitle: locale === "en" ? "Newsroom" : "غرفة الأخبار",
        siteTagline: title,
        locale,
        defaultLocale: "ar",
        direction: locale === "ar" ? "rtl" : "ltr",
        primaryNav: Array.from({ length: 12 }, (_, index) => ({
          id: String(index),
          title: index === 0 ? (locale === "en" ? "Home" : "الرئيسية") : title,
          url: `/${locale}/category/${index}`,
          order: index,
        })),
        languages: [
          {
            code: "en",
            name: "English",
            nativeName: "English",
            url: "/en",
            isActive: locale === "en",
            isDefault: false,
            direction: "ltr",
          },
          {
            code: "ar",
            name: "Arabic",
            nativeName: "العربية",
            url: "/",
            isActive: locale === "ar",
            isDefault: true,
            direction: "rtl",
          },
        ],
      }}
    />
  )
}
