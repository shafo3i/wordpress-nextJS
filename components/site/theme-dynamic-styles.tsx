import type { ThemeMods } from "@/lib/themes/types";
import { DEFAULT_ARABIC_FONT, getFontFamilyCss, getGoogleFontsUrl } from "@/lib/customizer/fonts";
import { buildThemeCss } from "@/lib/customizer/css";
import { getThemeSettings } from "@/lib/customizer/registry";

export { getFontFamilyCss };

/** Emits the theme CSS variables and rules generated from the customizer schema, plus only the fonts in use. */
export function ThemeDynamicStyles({ mods, themeSlug }: { mods: ThemeMods; themeSlug?: string }) {
  const css = buildThemeCss(mods, { settings: getThemeSettings(themeSlug ?? "") });
  const fontsUrl = getGoogleFontsUrl([
    mods.headingFontFamily,
    mods.bodyFontFamily,
    mods.siteTitleFontFamily,
    mods.widgetTitleFontFamily,
    mods.navFontFamily,
    mods.arabicHeadingFontFamily ?? DEFAULT_ARABIC_FONT,
    mods.arabicBodyFontFamily ?? DEFAULT_ARABIC_FONT,
  ]);

  return (
    <>
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}