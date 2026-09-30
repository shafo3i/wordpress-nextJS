import { AdminShell, getAdminLanguageContext } from "@/components/admin/admin-shell";
import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import { getThemeSettingsQuery } from "./query";
import { ThemeSettingsShell } from "./_components";

export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  await verifyAdminOrEditor();

  const params = await searchParams;
  const langContext = await getAdminLanguageContext();
  const dict = langContext.dict;
  const direction: "rtl" | "ltr" = langContext.direction === "rtl" ? "rtl" : "ltr";

  const { allThemes, currentTheme, homepageSettings, categories } =
    await getThemeSettingsQuery(params.theme);

  return (
    <AdminShell>
      <ThemeSettingsShell
        themeSlug={currentTheme.slug}
        themeName={currentTheme.name}
        allThemes={allThemes}
        initialSettings={homepageSettings}
        categories={categories}
        dict={dict}
        direction={direction}
      />
    </AdminShell>
  );
}
