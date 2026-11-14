import { createRoot } from "react-dom/client"
import { PreviewHost } from "../../app/customize-preview/preview-host"
import { CustomHtmlRender } from "../../widgets/custom-html"
import { AdManagerRender } from "../../widgets/ad-manager"
import { DEFAULT_THEME } from "../../components/site/utils"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
export function render(mode: "html" | "preview", locale: "en" | "ar") {
  const theme = {
    ...DEFAULT_THEME,
    dict: locale === "ar" ? ar : en,
    locale,
    isDefaultLocale: true,
  }
  const item = {
    id: "test",
    type: "custom_html",
    title: "Safe",
    content:
      '<p>Safe content</p><script>window.securityHit=1</script><img src="x" onerror="window.securityHit=1"><iframe src="https://evil.test"></iframe>',
    config: { adType: "html" },
  }
  const root = createRoot(document.getElementById("fixture")!)
  if (mode === "html")
    root.render(
      <>
        <CustomHtmlRender item={item} theme={theme} />
        <AdManagerRender item={item} theme={theme} />
      </>
    )
  else
    root.render(
      <PreviewHost
        themeSlug="pressforge-broadsheet"
        baseTheme={theme}
        initialState={{
          mods: {},
          siteTitle: "Initial",
          siteTagline: "",
          page: "home",
        }}
        posts={[]}
        categoryArchive={null}
        categorySidebar={[]}
        homepageSettings={{ layout: "full_width", blocks: [] }}
        primarySidebar={[]}
        secondarySidebar={[]}
        footerWidgets={{ col1: [], col2: [], col3: [] }}
      />
    )
}
