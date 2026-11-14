import { useState } from "react"
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"
import { SettingsSiteIdentity } from "../../app/(admin)/admincp/settings/_components/settings-site-identity"
import { SettingsEmailTemplates } from "../../app/(admin)/admincp/settings/_components/settings-email-templates"
import { localizedSiteOptions } from "../../lib/site-identity"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"

let root: ReturnType<typeof createRoot>
function Fixture({ rtl }: { rtl: boolean }) {
  const [settings, setSettings] = useState<Record<string, string>>({
    blogname: "Default publication",
    blogdescription: "Default tagline",
    site_identity_translations: "{}",
  })
  const [siteLocale, setSiteLocale] = useState("ar")
  const identity = localizedSiteOptions(settings, siteLocale, "ar")
  return (
    <main dir={rtl ? "rtl" : "ltr"}>
      <SettingsSiteIdentity
        settings={settings}
        languages={[
          {
            code: "ar",
            name: "Arabic",
            nativeName: "Arabic",
            direction: "rtl",
            isDefault: true,
          },
          {
            code: "en",
            name: "English",
            nativeName: "English",
            direction: "ltr",
            isDefault: false,
          },
        ]}
        dict={rtl ? ar : en}
        onChange={(key, value) =>
          setSettings((previous) => ({ ...previous, [key]: value }))
        }
      />
      <select
        aria-label="Preview language"
        value={siteLocale}
        onChange={(event) => setSiteLocale(event.target.value)}
      >
        <option value="ar">AR</option>
        <option value="en">EN</option>
      </select>
      <h1>{identity.blogname}</h1>
      <p data-tagline>{identity.blogdescription}</p>
      <output>{JSON.stringify(settings)}</output>
    </main>
  )
}
export function render(rtl: boolean) {
  root ??= createRoot(document.getElementById("fixture")!)
  flushSync(() => root.render(<Fixture key={String(rtl)} rtl={rtl} />))
}

function EmailFixture({ rtl }: { rtl: boolean }) {
  const [settings, setSettings] = useState<Record<string, string>>({
    email_welcome_subject: "Default welcome",
    email_template_translations: "{}",
  })
  const [locale, setLocale] = useState("ar")
  return (
    <main dir={rtl ? "rtl" : "ltr"}>
      <SettingsEmailTemplates
        settings={settings}
        locale={locale}
        onLocaleChange={setLocale}
        languages={[
          {
            code: "ar",
            name: "Arabic",
            nativeName: "Arabic",
            direction: "rtl",
            isDefault: true,
          },
          {
            code: "en",
            name: "English",
            nativeName: "English",
            direction: "ltr",
            isDefault: false,
          },
        ]}
        dict={rtl ? ar : en}
        onChange={(key, value) =>
          setSettings((previous) => ({ ...previous, [key]: value }))
        }
      />
      <output>{JSON.stringify(settings)}</output>
    </main>
  )
}
export function renderEmail(rtl: boolean) {
  root ??= createRoot(document.getElementById("fixture")!)
  flushSync(() => root.render(<EmailFixture key={String(rtl)} rtl={rtl} />))
}
