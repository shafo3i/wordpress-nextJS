"use client"
import type { PluginFormConfig } from "@/db/schema/cms-plugins"
import { useState } from "react"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import type { PluginManifest } from "@/lib/plugins/types"
import { retiredPlugins } from "@/db/schema/cms-plugins"
import { savePluginConfigAction } from "../actions"
import { FactReviewPanel } from "./fact-review-panel"
import { NewsletterSubscribers } from "./newsletter-subscribers"

type Language = { code: string; name: string }
export function PluginConfigForm({
  slug,
  manifest,
  config: initialConfig,
  dict,
  direction = "ltr",
  languages = [],
  defaultLocale = "en",
  canManage = false,
}: {
  slug: string
  manifest: PluginManifest
  config: PluginFormConfig
  dict: Record<string, string>
  direction?: "rtl" | "ltr"
  languages?: Language[]
  defaultLocale?: string
  canManage?: boolean
}) {
  const [config, setConfig] = useState(initialConfig),
    [locale, setLocale] = useState(defaultLocale),
    [notice, setNotice] = useState("")
  const save = useMutation({
    mutationFn: () => savePluginConfigAction(slug, config),
    onSuccess: (result) =>
      setNotice(
        result.success
          ? "admin.plugins.save_success"
          : result.error || "admin.plugins.save_failed"
      ),
    onError: () => setNotice("admin.plugins.save_failed"),
  })
  const update = (key: string, value: unknown) =>
    setConfig((previous) => ({ ...previous, [key]: value }))
  const input = (
    key: string,
    type = "text",
    label = `admin.plugins.field.${key}`
  ) => (
    <label key={key} className="block space-y-1">
      <span>{dict[label]}</span>
      {type === "checkbox" ? (
        <input
          type="checkbox"
          checked={config[key] === true}
          onChange={(e) => update(key, e.target.checked)}
        />
      ) : type === "textarea" ? (
        <textarea
          rows={4}
          maxLength={key === "customHtml" ? 20000 : 4000}
          className="block w-full border border-[#8c8f94] p-2"
          value={String(config[key] || "")}
          onChange={(e) => update(key, e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="block h-[30px] w-full border border-[#8c8f94] px-2"
          value={String(config[key] ?? "")}
          onChange={(e) =>
            update(
              key,
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
        />
      )}
    </label>
  )
  const select = (key: string, values: string[]) => (
    <label key={key} className="block">
      {dict[`admin.plugins.field.${key}`]}
      <select
        aria-label={dict[`admin.plugins.field.${key}`]}
        className="block h-[30px] border border-[#8c8f94]"
        value={String(config[key] || values[0])}
        onChange={(e) => update(key, e.target.value)}
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {dict[`admin.plugins.option.${value}`]}
          </option>
        ))}
      </select>
    </label>
  )
  const wording =
    locale === defaultLocale ? config : config.translations?.[locale] || {}
  const updateWording = (key: string, value: string) =>
    locale === defaultLocale
      ? update(key, value)
      : setConfig((previous) => ({
          ...previous,
          translations: {
            ...previous.translations,
            [locale]: { ...previous.translations?.[locale], [key]: value },
          },
        }))
  const retired = retiredPlugins.has(slug)
  return (
    <div
      dir={direction}
      className="mx-auto max-w-5xl space-y-5 pb-8 text-start"
    >
      <Link href="/admincp/plugins" className="text-[#2271b1]">
        {dict["admin.plugins.back_to_list"]}
      </Link>
      <h1 className="text-xl font-semibold">
        {dict[`admin.plugins.catalog.${slug}.name`] || manifest.name}
      </h1>
      {retired ? (
        <p className="border border-[#c3c4c7] bg-white p-4">
          {dict["admin.plugins.retired"]}{" "}
          <Link href="/admincp/customize" className="text-[#2271b1] underline">
            {dict["admin.plugins.open_customizer"]}
          </Link>
        </p>
      ) : slug === "fact-check" ? (
        <FactReviewPanel dict={dict} />
      ) : canManage ? (
        <form
          className="space-y-4 border border-[#c3c4c7] bg-white p-5"
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
        >
          <fieldset disabled={save.isPending} className="space-y-4">
            {slug === "newsletter" && (
              <>
                <label>
                  {dict["admin.plugins.subscribers.language"]}
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="mx-2 h-[30px] border border-[#8c8f94]"
                  >
                    {languages.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </label>
                {["brandName", "pitch", "buttonText"].map((key) => (
                  <label className="block" key={key}>
                    {dict[`admin.plugins.field.${key}`]}
                    <input
                      className="block h-[30px] w-full border border-[#8c8f94] px-2"
                      maxLength={4000}
                      value={String(wording[key] || "")}
                      onChange={(e) => updateWording(key, e.target.value)}
                    />
                  </label>
                ))}
                {input("sendWelcomeEmail", "checkbox")}
                <p>
                  {dict["admin.plugins.newsletter.email_settings"]}{" "}
                  <Link
                    className="text-[#2271b1] underline"
                    href="/admincp/settings"
                  >
                    {dict["admin.plugins.open_settings"]}
                  </Link>
                </p>
              </>
            )}
            {slug === "related-posts" && (
              <>
                {input("count", "number")}
                {select("matchStrategy", ["categories", "tags", "recent"])}
                {select("displayStyle", ["list", "grid"])}
                {input("showThumbnail", "checkbox")}
                {input("showDate", "checkbox")}
              </>
            )}
            {slug === "ad-manager" && (
              <>
                {input("enabled", "checkbox")}
                {input("sponsorName")}
                {input("imageUrl", "url")}
                {input("targetUrl", "url")}
                {select("placement", ["before_content", "below_content"])}
                {input("customHtml", "textarea")}
                <p>{dict["admin.plugins.safe_html"]}</p>
              </>
            )}
            {slug === "breaking-news" && (
              <>
                {input("enabled", "checkbox")}
                {select("urgency", ["urgent", "developing", "alert"])}
                {input("badgeText")}
                {input("headline")}
                {input("targetUrl", "url")}
                {input("enablePulse", "checkbox")}
              </>
            )}
            {slug === "article-audio" && (
              <>
                {input("audioUrl", "url")}
                {input("stationName")}
                <p>{dict["admin.plugins.audio.help"]}</p>
              </>
            )}
            {slug === "table-of-contents" && (
              <>
                {input("title")}
                {input("minHeadings", "number")}
                {input("collapsible", "checkbox")}
              </>
            )}
            <button className="h-[30px] border border-[#2271b1] bg-[#2271b1] px-3 text-white">
              {dict["admin.plugins.save_settings"]}
            </button>
          </fieldset>
          {notice && (
            <p role="status">
              {dict[notice] || dict["admin.plugins.save_failed"]}
            </p>
          )}
        </form>
      ) : (
        <p>{dict["admin.plugins.forbidden"]}</p>
      )}
      {slug === "newsletter" && canManage && (
        <NewsletterSubscribers dict={dict} languages={languages} />
      )}
    </div>
  )
}
