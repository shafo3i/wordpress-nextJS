import type { ThemeMods } from "@/lib/themes/types";
import { DEFAULT_ARABIC_FONT, getFontFamilyCss, getLocalFontStylesheets } from "@/lib/customizer/fonts";
import { buildThemeCss } from "@/lib/customizer/css";
import { getThemeSettings } from "@/lib/customizer/registry";

export { getFontFamilyCss };

/** Emits the theme CSS variables and rules generated from the customizer schema, plus only the fonts in use. */
export function ThemeDynamicStyles({ mods, themeSlug }: { mods: ThemeMods; themeSlug?: string }) {
  const css = buildThemeCss(mods, { settings: getThemeSettings(themeSlug ?? "") });
  const fontStylesheets = getLocalFontStylesheets([
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
      {fontStylesheets.map(href => <link key={href} rel="stylesheet" href={href} precedence="fonts" />)}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
