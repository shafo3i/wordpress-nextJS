"use client"

import { useState, useTransition, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Columns3, LayoutTemplate, PanelLeft, PanelRight } from "lucide-react"
import type { Theme } from "@/lib/themes/types"
import type { ThemeLayoutSettings } from "@/db/schema/cms-theme-layout"
import { saveThemeLayoutAction } from "../action"
import { ThemeSettingsHeader } from "./theme-settings-header"

const layouts = [
  { id: "full_width", Icon: LayoutTemplate },
  { id: "right_sidebar", Icon: PanelRight },
  { id: "left_sidebar", Icon: PanelLeft },
  { id: "dual_sidebar", Icon: Columns3 },
] as const

export function ThemeSettingsShell({
  themeSlug,
  themeName,
  allThemes,
  initialLayout,
  defaultLayout,
  usesPage,
  studioPages,
  dict,
  direction,
}: {
  themeSlug: string
  themeName: string
  allThemes: Theme[]
  initialLayout: ThemeLayoutSettings
  defaultLayout: ThemeLayoutSettings
  usesPage: boolean
  studioPages: { id: string; language: string }[]
  dict: Record<string, string>
  direction: "rtl" | "ltr"
}) {
  const [settings, setSettings] = useState(initialLayout)
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    error?: boolean
    key: string
  } | null>(null)
  const router = useRouter()
  function save(event: FormEvent) {
    event.preventDefault()
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await saveThemeLayoutAction(themeSlug, settings)
        setFeedback(
          result.success
            ? { key: "admin.theme_layout.saved" }
            : {
                error: true,
                key: result.error || "admin.theme_layout.save_error",
              }
        )
        if (result.success) router.refresh()
      } catch {
        setFeedback({ error: true, key: "admin.theme_layout.save_error" })
      }
    })
  }
  const customizerUrl = `/admincp/customize?theme=${encodeURIComponent(themeSlug)}`
  return (
    <form
      onSubmit={save}
      dir={direction}
      className="space-y-5 text-start text-[13px] text-[#1d2327]"
    >
      <ThemeSettingsHeader
        {...{ themeSlug, themeName, allThemes, dict }}
        isPending={pending}
        onReset={() => {
          setSettings(defaultLayout)
          setFeedback({ key: "admin.theme_layout.reset_notice" })
        }}
      />
      {feedback && (
        <p
          role={feedback.error ? "alert" : "status"}
          className={`border-s-4 bg-white p-3 ${feedback.error ? "border-[#d63638]" : "border-[#00a32a]"}`}
        >
          {dict[feedback.key]}
        </p>
      )}
      <section className="space-y-2 border-s-4 border-[#2271b1] bg-white p-4">
        <h2 className="font-semibold">
          {dict["admin.theme_layout.scope_title"]}
        </h2>
        <p className="text-[#646970]">
          {
            dict[
              usesPage
                ? "admin.theme_layout.scope_page"
                : "admin.theme_layout.scope_feed"
            ]
          }
        </p>
        <div className="flex flex-wrap gap-4 text-[#2271b1]">
          {studioPages.map((page) => (
            <Link key={page.id} href={`/admincp/studio/${page.id}`}>
              {dict["admin.theme_layout.edit_studio"]} — {page.language}
            </Link>
          ))}
          <Link href="/admincp/settings">
            {dict["admin.theme_layout.reading_settings"]}
          </Link>
        </div>
      </section>
      <fieldset
        disabled={pending}
        className="space-y-4 rounded-[3px] border border-[#c3c4c7] bg-white p-5"
      >
        <legend className="px-2 text-sm font-semibold">
          {dict["admin.theme_layout.feed_layout"]}
        </legend>
        <p className="text-[#646970]">{dict["admin.theme_layout.feed_help"]}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {layouts.map(({ id, Icon }) => (
            <label
              key={id}
              className={`flex cursor-pointer items-start gap-3 rounded-[3px] border p-4 ${settings.layout === id ? "border-[#2271b1] bg-[#f0f6fc]" : "border-[#c3c4c7]"}`}
            >
              <input
                type="radio"
                name="feed-layout"
                value={id}
                checked={settings.layout === id}
                onChange={() => setSettings({ ...settings, layout: id })}
              />
              <span className="space-y-2">
                <Icon size={24} aria-hidden="true" />
                <span className="block font-semibold">
                  {dict[`admin.theme_settings.layout.${id}.name`]}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="grid gap-5 border-t border-[#dcdcde] pt-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="block font-semibold">
              {dict["admin.theme_layout.sidebar_width"]}
            </span>
            <input
              className="h-[30px] w-full max-w-xs rounded-[3px] border border-[#8c8f94] px-2"
              type="number"
              min={220}
              max={420}
              step={1}
              value={settings.sidebarWidth ?? ""}
              placeholder={dict["admin.theme_layout.inherit"]}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  sidebarWidth:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
            />
            <span className="block text-xs text-[#646970]">
              {dict["admin.theme_layout.sidebar_width_help"]}
            </span>
          </label>
          <label className="space-y-1">
            <span className="block font-semibold">
              {dict["admin.theme_layout.column_gap"]}
            </span>
            <input
              className="h-[30px] w-full max-w-xs rounded-[3px] border border-[#8c8f94] px-2"
              type="number"
              min={0}
              max={80}
              step={1}
              value={settings.columnGap ?? ""}
              placeholder={dict["admin.theme_layout.inherit"]}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  columnGap:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
            />
            <span className="block text-xs text-[#646970]">
              {dict["admin.theme_layout.column_gap_help"]}
            </span>
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.stickySidebars}
            onChange={(event) =>
              setSettings({ ...settings, stickySidebars: event.target.checked })
            }
          />
          {dict["admin.theme_layout.sticky"]}
        </label>
      </fieldset>
      <section className="rounded-[3px] border border-[#c3c4c7] bg-white p-5">
        <h2 className="text-sm font-semibold">
          {dict["admin.theme_layout.other_controls"]}
        </h2>
        <p className="mt-1 text-[#646970]">
          {dict["admin.theme_layout.other_help"]}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-[#2271b1]">
          <Link href={customizerUrl}>
            {dict["admin.theme_layout.open_customizer"]}
          </Link>
          <Link href="/admincp/widgets">
            {dict["admin.theme_layout.widget_areas"]}
          </Link>
          <Link href="/admincp/pages">{dict["admin.theme_layout.pages"]}</Link>
        </div>
      </section>
    </form>
  )
}
