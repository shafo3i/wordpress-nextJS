import type { ThemeMods } from "@/lib/themes/types"
import { archiveSection } from "./core-sections/archive"

export type ArchiveSettings = Required<
  Pick<
    ThemeMods,
    | "archiveLayout"
    | "archiveColumns"
    | "archiveContentWidth"
    | "archivePostsPerPage"
    | "archiveFeatured"
    | "archiveSidebar"
    | "archiveGap"
    | "archivePadding"
    | "archiveRadius"
    | "archiveBorder"
    | "archiveTitleSize"
    | "archiveTitleWeight"
    | "archiveExcerptLength"
    | "archiveShowDate"
    | "archiveShowAuthor"
    | "archiveShowCategory"
    | "archiveShowImages"
    | "archiveImageWidth"
    | "archiveImageHeight"
    | "archiveGridImageHeight"
    | "archiveImageRadius"
  >
>

export function getArchiveSettings(mods: ThemeMods = {}): ArchiveSettings {
  const result: Record<string, unknown> = {}
  for (const setting of archiveSection.groups.flatMap((g) => g.settings)) {
    const value = mods[setting.id as keyof ThemeMods]
    let clean: unknown = setting.default
    if (setting.type === "toggle")
      clean = typeof value === "boolean" ? value : setting.default
    else if (
      setting.type === "range" &&
      typeof value === "number" &&
      Number.isFinite(value)
    )
      clean = Math.round(Math.max(setting.min!, Math.min(setting.max!, value)))
    else if (setting.options?.some((o) => o.value === String(value)))
      clean = setting.numeric ? Number(value) : value
    result[setting.id] = clean
  }
  return result as ArchiveSettings
}

export function archivePageNumbers(
  total: number,
  current: number
): (number | null)[] {
  const values = new Set([1, total])
  for (
    let page = Math.max(1, current - 2);
    page <= Math.min(total, current + 2);
    page++
  )
    values.add(page)
  const result: (number | null)[] = []
  for (const page of [...values].filter((n) => n > 0).sort((a, b) => a - b)) {
    const last = result.at(-1)
    if (typeof last === "number" && page - last > 1) result.push(null)
    result.push(page)
  }
  return result
}
