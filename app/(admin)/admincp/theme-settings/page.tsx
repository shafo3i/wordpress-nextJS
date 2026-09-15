import { AdminShell } from "@/components/admin/admin-shell";
import { getActiveThemeName, getActiveThemeSlug, getAllThemes } from "@/lib/themes/loader";
import { getHomepageSettings } from "@/lib/themes/homepage-blocks";
import { getCategoriesForMenu } from "@/lib/menus/db";
import { ThemeSettingsShell } from "@/components/admin/theme-settings/theme-settings-shell";

export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const params = await searchParams;
  const activeSlug = await getActiveThemeSlug();
  const targetSlug = params.theme || activeSlug;

  const [allThemes, homepageSettings, categories] = await Promise.all([
    getAllThemes(),
    getHomepageSettings(targetSlug),
    getCategoriesForMenu(),
  ]);

  const currentTheme = allThemes.find((t) => t.slug === targetSlug) || allThemes[0];

  return (
    <AdminShell>
      <ThemeSettingsShell
        themeSlug={currentTheme.slug}
        themeName={currentTheme.name}
        allThemes={allThemes}
        initialSettings={homepageSettings}
        categories={categories}
      />
    </AdminShell>
  );
}
