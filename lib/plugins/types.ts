import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"

export type PluginContext = {
  article?: Partial<ContentItem>
  theme?: Partial<FrontEndThemeContext>
  themeSlug?: string
}

export type PluginManifest = {
  slug: string
  name: string
  description: string
  version: string
  author: string
  authorUrl?: string
  pluginUrl?: string
  isActive?: boolean
  isInstalled?: boolean
  settingsUrl?: string
  rating?: number
  reviewsCount?: number
  activeInstalls?: string
  icon?: string
  category?: "Featured" | "Popular" | "Recommended"
}

export type FilterCallback<T = unknown> = (
  value: T,
  context?: PluginContext
) => T | Promise<T>
export type ActionCallback = (context?: PluginContext) => void | Promise<void>

export type HookItem<T = unknown> = {
  callback: T
  priority: number
}

export type PluginModule = {
  manifest: PluginManifest
  init: () => void | Promise<void>
}
