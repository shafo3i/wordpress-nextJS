"use client"
import { useState } from "react"
import { parseSiteIdentity } from "@/lib/site-identity"

export type SettingsIdentityLanguage = {
  code: string
  name: string
  nativeName: string
  direction: string
  isDefault: boolean
}

export function SettingsSiteIdentity({
  settings,
  languages,
  dict,
  onChange,
}: {
  settings: Record<string, string>
  languages: SettingsIdentityLanguage[]
  dict: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const defaultCode =
    languages.find((language) => language.isDefault)?.code ||
    languages[0]?.code ||
    "en"
  const [selected, setSelected] = useState(defaultCode)
  const language = languages.find((language) => language.code === selected)
  const translations = parseSiteIdentity(settings.site_identity_translations)
  const update = (field: "title" | "tagline", value: string) => {
    if (selected === defaultCode)
      onChange(field === "title" ? "blogname" : "blogdescription", value)
    else
      onChange(
        "site_identity_translations",
        JSON.stringify({
          ...translations,
          [selected]: { ...translations[selected], [field]: value },
        })
      )
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]">
        <label
          htmlFor="identity-language"
          className="text-[13px] font-semibold text-[#1d2327]"
        >
          {dict["admin.settings.identity_language"]}
        </label>
        <div>
          <select
            id="identity-language"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338]"
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.nativeName || language.name} (
                {language.code.toUpperCase()})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[#646970]">
            {dict["admin.settings.identity_language_help"]}
          </p>
        </div>
      </div>
      {(
        [
          { field: "title", key: "blogname", label: "site_title" },
          { field: "tagline", key: "blogdescription", label: "tagline" },
        ] as const
      ).map(({ field, key, label }) => (
        <div
          key={field}
          className="grid grid-cols-1 gap-2 md:grid-cols-[220px_1fr]"
        >
          <label
            htmlFor={key}
            className="text-[13px] font-semibold text-[#1d2327]"
          >
            {dict[`admin.settings.${label}`]} ({selected.toUpperCase()})
          </label>
          <div>
            <input
              id={key}
              type="text"
              dir={language?.direction === "rtl" ? "rtl" : "ltr"}
              lang={selected}
              value={
                selected === defaultCode
                  ? settings[key] || ""
                  : translations[selected]?.[field] || ""
              }
              placeholder={
                selected !== defaultCode ? settings[key] || "" : undefined
              }
              onChange={(event) => update(field, event.target.value)}
              maxLength={field === "title" ? 300 : 1000}
              className="h-[32px] w-full max-w-md rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-[#646970]">
              {dict[`admin.settings.${label}_desc`]}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
