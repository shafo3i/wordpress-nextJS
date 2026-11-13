import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import { getThemeSettingsQuery } from "./query"
import { ThemeSettingsShell } from "./_components"

export const dynamic = "force-dynamic"

export default async function ThemeSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>
}) {
  await verifyAdmin()

  const params = await searchParams
  const langContext = await getAdminLanguageContext()
  const dict = langContext.dict
  const direction: "rtl" | "ltr" =
    langContext.direction === "rtl" ? "rtl" : "ltr"

  const {
    allThemes,
    currentTheme,
    initialLayout,
    defaultLayout,
    usesPage,
    studioPages,
  } = await getThemeSettingsQuery(params.theme)

  return (
    <AdminShell>
      <ThemeSettingsShell
        key={currentTheme.slug}
        themeSlug={currentTheme.slug}
        themeName={currentTheme.name}
        allThemes={allThemes}
        initialLayout={initialLayout}
        defaultLayout={defaultLayout}
        usesPage={usesPage}
        studioPages={studioPages}
        dict={dict}
        direction={direction}
      />
    </AdminShell>
  )
}
