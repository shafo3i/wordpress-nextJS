import { createRoot } from "react-dom/client"
import { SiteHeader } from "../../components/site/header/site-header"
import { ThemeDynamicStyles } from "../../components/site/theme-dynamic-styles"
import { DEFAULT_THEME } from "../../components/site/utils"
import { resolveMods } from "../../lib/customizer/resolve"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
import type { FrontEndThemeContext } from "../../lib/site-theme"

let root: ReturnType<typeof createRoot>
export function render(
  themeSlug: string,
  layout: FrontEndThemeContext["headerLayout"],
  rtl: boolean,
  sticky = true
) {
  root ??= createRoot(document.getElementById("header-fixture")!)
  const theme: FrontEndThemeContext = {
    ...DEFAULT_THEME,
    themeSlug,
    headerLayout: layout,
    locale: rtl ? "ar" : "en",
    direction: rtl ? "rtl" : "ltr",
    dict: rtl ? ar : en,
    siteTitle: rtl ? "غرفة الأخبار" : "The Newsroom",
    siteTagline: "",
    mods: {
      ...resolveMods(themeSlug),
      headerLayout: layout,
      stickyHeader: sticky,
      showTopBar: false,
      showTagline: false,
      showSiteTitle: true,
      navHeight: 56,
      mastheadPadding: 16,
    },
    primaryNav: [
      { id: "home", title: rtl ? "الرئيسية" : "Home", url: "/", order: 1 },
      {
        id: "desk",
        title: rtl ? "قسم الأعمال" : "Business desk",
        url: "/business-desk-en",
        order: 2,
      },
      {
        id: "about",
        title: rtl ? "عن غرفة الأخبار" : "About the newsroom",
        url: "/about-en",
        order: 3,
      },
    ],
  }
  root.render(
    <div dir={theme.direction}>
      <ThemeDynamicStyles mods={theme.mods} themeSlug={themeSlug} />
      <SiteHeader theme={theme} />
      <main style={{ height: 1800 }} />
    </div>
  )
}
