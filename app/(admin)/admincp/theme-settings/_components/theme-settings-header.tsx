"use client"

import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"
import type { Theme } from "@/lib/themes/types"

export function ThemeSettingsHeader({
  themeSlug,
  themeName,
  allThemes,
  isPending,
  onReset,
  dict,
}: {
  themeSlug: string
  themeName: string
  allThemes: Theme[]
  isPending: boolean
  onReset: () => void
  dict: Record<string, string>
}) {
  const router = useRouter()
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#c3c4c7] pb-4">
      <div>
        <h1 className="text-[23px] font-normal text-[#1d2327]">
          {dict["admin.theme_layout.title"]}
        </h1>
        <p className="mt-1 text-[13px] text-[#646970]">
          {dict["admin.theme_layout.description"]}
        </p>
        <p className="mt-1 font-semibold">{themeName}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          {dict["admin.theme_settings.theme_label"]}
          <select
            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2"
            aria-label={dict["admin.theme_settings.theme_label"]}
            value={themeSlug}
            disabled={isPending}
            onChange={(event) =>
              router.push(
                `/admincp/theme-settings?theme=${encodeURIComponent(event.target.value)}`
              )
            }
          >
            {allThemes.map((theme) => (
              <option key={theme.slug} value={theme.slug}>
                {theme.name}
                {theme.isActive
                  ? ` ${dict["admin.theme_settings.active_badge"]}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={isPending}
          onClick={onReset}
          className="flex h-[30px] items-center gap-1.5 rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 text-[#2271b1] disabled:opacity-50"
        >
          <RotateCcw size={14} />
          {dict["admin.theme_layout.reset"]}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 text-white disabled:opacity-50"
        >
          {
            dict[
              isPending
                ? "admin.theme_settings.saving"
                : "admin.theme_layout.save"
            ]
          }
        </button>
      </div>
    </header>
  )
}
