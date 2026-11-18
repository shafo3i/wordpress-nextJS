import { createRoot } from "react-dom/client"
import { ThemeDynamicStyles } from "../../components/site/theme-dynamic-styles"
import { StudioDesignSurface } from "../../components/site/studio/studio-design"
import { FONTS, BASE_FONT_STYLESHEETS } from "../../lib/customizer/fonts"
export const catalog = FONTS
export function render(locale: "en" | "ar") {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  createRoot(document.getElementById("fixture")!).render(
    <>
      {BASE_FONT_STYLESHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="fonts" />
      ))}
      <ThemeDynamicStyles
        mods={{
          headingFontFamily: "inter",
          bodyFontFamily: "inter",
          arabicHeadingFontFamily: "cairo",
          arabicBodyFontFamily: "cairo",
        }}
      />
      <h1>
        {locale === "ar"
          ? "آخر الأخبار من غرفة الأخبار"
          : "The latest from the newsroom"}
      </h1>
      <StudioDesignSurface
        design={{
          typography: {
            title: { desktop: { family: "amiri", weight: "700" } },
          },
        }}
      >
        <h2 data-studio-title>عنوان المقال في الاستوديو</h2>
      </StudioDesignSurface>
    </>
  )
}
