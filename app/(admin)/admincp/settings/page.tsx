import { switchAdminLanguageAction } from "@/app/(admin)/admincp/languages/action"
import { siteBaseUrl } from "@/lib/seo/urls"
import {
  AdminShell,
  getAdminLanguageContext,
} from "@/components/admin/admin-shell"
import { verifyAdmin } from "@/lib/authMIddleware"
import {
  getSettingsQuery,
  getSettingsPagesQuery,
  getSettingsLogoQuery,
} from "./query"
import { SettingsForm } from "./_components/settings-form"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  await verifyAdmin()

  const [langContext, settings, pages, logo] = await Promise.all([
    getAdminLanguageContext(),
    getSettingsQuery(),
    getSettingsPagesQuery(),
    getSettingsLogoQuery(),
  ])

  const dict = langContext.dict
  const direction: "rtl" | "ltr" =
    langContext.direction === "rtl" ? "rtl" : "ltr"

  return (
    <AdminShell>
      <div dir={direction} className="space-y-4 text-start">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c3c4c7] pb-3">
          <h1 className="text-[23px] leading-normal font-normal text-[#1d2327]">
            {dict["admin.settings.title"]}
          </h1>
        </div>

        <form
          action={switchAdminLanguageAction}
          className="flex flex-wrap items-center gap-3 text-[13px]"
        >
          <label htmlFor="settings-interface-language">
            {dict["admin.settings.interface_language"]}
          </label>
          <select
            id="settings-interface-language"
            name="code"
            defaultValue={langContext.code}
            className="h-[30px] border border-[#8c8f94] bg-white px-2"
          >
            {langContext.allLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName || language.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[#2271b1]"
          >
            {dict["admin.common.apply"]}
          </button>
          <p className="text-[12px] text-[#646970]">
            {dict["admin.settings.interface_language_help"]}
          </p>
        </form>
        {/* Settings Form */}
        <SettingsForm
          initialSettings={settings}
          languages={langContext.allLanguages.map((language) => ({
            code: language.code,
            name: language.name,
            nativeName: language.nativeName || language.name,
            direction: language.direction,
            isDefault: language.isDefault,
          }))}
          effectiveSiteUrl={siteBaseUrl(settings)}
          timeZones={[
            ...new Set([
              "UTC",
              settings.timezone_string,
              ...Intl.supportedValuesOf("timeZone"),
            ]),
          ].filter(Boolean)}
          initialLogoUrl={logo.url}
          pages={pages}
          dict={dict}
          direction={direction}
        />
      </div>
    </AdminShell>
  )
}
