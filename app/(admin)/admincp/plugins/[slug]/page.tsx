import { pluginSlugSchema } from "@/db/schema/cms-plugins"
import { notFound } from "next/navigation"
import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdminOrEditor } from "@/lib/authMIddleware"
import { AVAILABLE_PLUGINS } from "@/plugins/registry"
import { getPluginConfig } from "@/lib/plugins/config"
import {
  getActiveLanguages,
  getDefaultLanguage,
} from "@/services/language.service"
import { PluginConfigForm } from "./_components/plugin-config-form"

export const dynamic = "force-dynamic"

interface PluginSettingsPageProps {
  params: Promise<{ slug: string }>
}

export default async function PluginSettingsPage({
  params,
}: PluginSettingsPageProps) {
  const session = await verifyAdminOrEditor()

  const { slug } = await params
  const pluginModule = AVAILABLE_PLUGINS[slug]

  if (!pluginModule) {
    notFound()
  }

  const langContext = await getAdminLanguageContext()
  const config = await getPluginConfig(pluginSlugSchema.parse(slug))
  const [languages, defaultLanguage] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
  ])

  return (
    <AdminShell>
      <PluginConfigForm
        slug={slug}
        manifest={pluginModule.manifest}
        config={config}
        canManage={session.user.role === "admin"}
        languages={languages.map((language) => ({
          code: language.code,
          name: language.nativeName || language.name,
        }))}
        defaultLocale={defaultLanguage?.code || "en"}
        dict={langContext.dict}
        direction={
          (langContext.direction === "rtl" ? "rtl" : "ltr") as "rtl" | "ltr"
        }
      />
    </AdminShell>
  )
}
