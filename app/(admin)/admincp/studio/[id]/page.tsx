import { notFound } from "next/navigation"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"
import { verifyAdminOrEditor } from "@/lib/authMIddleware"
import { getStudioEditorData } from "./query"
import { StudioShell } from "./_components/studio-shell"

export const dynamic = "force-dynamic"

export default async function StudioBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const session = await verifyAdminOrEditor()
  const [{ id }, { lang }] = await Promise.all([params, searchParams])

  const [data, langContext] = await Promise.all([
    getStudioEditorData(id, lang),
    getAdminLanguageContext(),
  ])

  if (!data) {
    notFound()
  }

  const activeLocale = data.contentLocale
  const dict = langContext.dict
  const direction: "rtl" | "ltr" =
    langContext.direction === "rtl" ? "rtl" : "ltr"

  return (
    <StudioShell
      canAssignHomepage={session.user.role === "admin"}
      key={`${data.page.id}:${activeLocale}`}
      pageId={data.page.id}
      initialTitle={data.page.title}
      initialSlug={data.page.slug}
      initialStatus={data.page.status}
      initialDocument={data.page.studioData}
      initialWidgetContent={data.widgetContent}
      pageLocale={data.pageLocale}
      initialIsFrontPage={data.page.isFrontPage}
      allPages={data.allPages}
      posts={data.posts}
      theme={data.theme}
      categories={data.categories}
      availableWidgets={data.availableWidgets}
      footerWidgets={data.footerWidgets}
      dict={dict}
      direction={direction}
      activeLocale={activeLocale}
      languages={langContext.allLanguages}
    />
  )
}
