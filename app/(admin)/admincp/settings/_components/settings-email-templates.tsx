"use client"
import { parseEmailTemplates } from "@/lib/email-template-settings"
import type { SettingsIdentityLanguage } from "./settings-site-identity"

export function SettingsEmailTemplates({
  settings,
  languages,
  dict,
  locale,
  onLocaleChange,
  onChange,
}: {
  settings: Record<string, string>
  languages: SettingsIdentityLanguage[]
  dict: Record<string, string>
  locale: string
  onLocaleChange: (value: string) => void
  onChange: (key: string, value: string) => void
}) {
  const defaultCode =
    languages.find((language) => language.isDefault)?.code ||
    languages[0]?.code ||
    "en"
  const translations = parseEmailTemplates(settings.email_template_translations)
  const fields = translations[locale] || (locale === defaultCode ? settings : {})
  const update = (key: string, value: string) => {
    if (locale === defaultCode) onChange(key, value)
    const defaultWording = translations[defaultCode] || {
      email_welcome_subject: settings.email_welcome_subject || "",
      email_welcome_heading: settings.email_welcome_heading || "",
      email_welcome_body: settings.email_welcome_body || "",
      email_footer_text: settings.email_footer_text || "",
    }
    onChange(
      "email_template_translations",
      JSON.stringify({
        [defaultCode]: defaultWording,
        ...translations,
        [locale]: {
          ...(translations[locale] ||
            (locale === defaultCode ? defaultWording : {})),
          [key]: value,
        },
      })
    )
  }
  const language = languages.find((language) => language.code === locale)
  return (
    <div className="space-y-4 rounded-[4px] border border-[#dcdcde] bg-[#f9fafb] p-4">
      <label
        htmlFor="email-template-language"
        className="block text-[13px] font-semibold text-[#1d2327]"
      >
        {dict["admin.settings.email_language"]}
      </label>
      <select
        id="email-template-language"
        value={locale}
        onChange={(event) => onLocaleChange(event.target.value)}
        className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px]"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName || language.name} (
            {language.code.toUpperCase()})
          </option>
        ))}
      </select>
      <p className="text-[12px] text-[#646970]">
        {dict["admin.settings.email_language_help"]}
      </p>
      {(
        [
          [
            "email_welcome_subject",
            "admin.settings.tpl_welcome_subject",
            false,
          ],
          ["email_welcome_heading", "admin.settings.tpl_welcome_title", false],
          ["email_welcome_body", "admin.settings.tpl_welcome_body", true],
          ["email_footer_text", "admin.settings.tpl_footer_text", true],
        ] as const
      ).map(([key, label, multiline]) => {
        const props = {
          id: key,
          value: fields[key] || "",
          onChange: (
            event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => update(key, event.target.value),
          dir: language?.direction === "rtl" ? "rtl" : "ltr",
          lang: locale,
          placeholder: dict["admin.settings.email_language_fallback"],
          className:
            "w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-2 text-[13px] text-[#2c3338]",
        }
        return (
          <div
            key={key}
            className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]"
          >
            <label
              htmlFor={key}
              className="text-[12px] font-medium text-[#1d2327]"
            >
              {dict[label]} ({locale.toUpperCase()})
            </label>
            {multiline ? (
              <textarea {...props} rows={3} maxLength={10000} />
            ) : (
              <input {...props} type="text" maxLength={1000} />
            )}
          </div>
        )
      })}
    </div>
  )
}
