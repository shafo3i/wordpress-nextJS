"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  Eye,
  EyeOff,
  FolderOpen,
  History,
  Home,
  Layers,
  Monitor,
  Plus,
  Redo2,
  Settings2,
  Smartphone,
  Tablet,
  Undo2,
} from "lucide-react"
import type { StudioPageTemplate } from "@/lib/studio/types"

interface StudioTopBarProps {
  canAssignHomepage?: boolean
  confirmNavigation?: () => boolean
  pageId: string
  pageTitle: string
  pageSlug: string
  pageStatus: string
  pageTemplate: StudioPageTemplate
  isFrontPage: boolean
  allPages: { id: string; title: string }[]
  device: "desktop" | "tablet" | "mobile"
  onDeviceChange: (device: "desktop" | "tablet" | "mobile") => void
  isStructureOpen: boolean
  onToggleStructure: () => void
  isPreviewMode: boolean
  onTogglePreview: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onOpenAddElements: () => void
  onOpenTemplatesModal: () => void
  onOpenPageSettings: () => void
  onPublish: (options?: { status?: string; setAsFrontPage?: boolean }) => void
  isSaving: boolean
  dict?: Record<string, string>
  activeLocale?: string
  languages?: { code: string; name: string; nativeName?: string | null }[]
}

export function StudioTopBar({
  canAssignHomepage = false,
  confirmNavigation,
  pageId,
  pageTitle,
  pageSlug,
  isFrontPage,
  allPages,
  device,
  onDeviceChange,
  isStructureOpen,
  onToggleStructure,
  isPreviewMode,
  onTogglePreview,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenAddElements,
  onOpenTemplatesModal,
  onOpenPageSettings,
  onPublish,
  isSaving,
  dict,
  activeLocale = "en",
  languages = [],
}: StudioTopBarProps) {
  const [logoMenuOpen, setLogoMenuOpen] = useState(false)
  const [docMenuOpen, setDocMenuOpen] = useState(false)
  const [publishMenuOpen, setPublishMenuOpen] = useState(false)

  const handleNavigation = (
    event: { preventDefault: () => void },
    after?: () => void
  ) => {
    if (confirmNavigation && !confirmNavigation()) {
      event.preventDefault()
      return
    }
    after?.()
  }

  return (
    <header className="z-50 flex h-12 shrink-0 items-center justify-between border-b border-[#27272a] bg-[#18181b] px-3 text-white select-none">
      {/* Left Actions */}
      <div className="flex items-center gap-1.5">
        {/* Studio Brand Badge & Exit Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLogoMenuOpen((v) => !v)}
            className="flex size-7 items-center justify-center rounded-full bg-white text-sm font-black text-[#18181b] shadow-sm transition-colors hover:bg-slate-200"
            title={dict?.["admin.studio.brand_menu"]}
          >
            S
          </button>

          {logoMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setLogoMenuOpen(false)}
              />
              <div className="absolute start-0 top-9 z-50 w-56 rounded-md border border-[#27272a] bg-[#1f1f23] py-1.5 text-xs text-slate-200 shadow-2xl">
                <Link
                  onNavigate={handleNavigation}
                  href={`/admincp/pages/${pageId}/edit`}
                  className="flex items-center gap-2 px-3 py-2 text-white hover:bg-[#2d2d33]"
                >
                  <span>← {dict?.["admin.studio.exit_to_editor"]}</span>
                </Link>
                <Link
                  onNavigate={handleNavigation}
                  href="/admincp/pages"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#2d2d33]"
                >
                  <span>{dict?.["admin.studio.all_pages"]}</span>
                </Link>
                <Link
                  onNavigate={handleNavigation}
                  href={`/${pageSlug}`}
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[#2d2d33]"
                >
                  <span>{dict?.["admin.studio.view_live_page"]} ↗</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* + Add Elements Button */}
        <button
          type="button"
          onClick={onOpenAddElements}
          className="ms-1 flex size-7 items-center justify-center rounded bg-[#27272a] text-white transition-colors hover:bg-[#3f3f46]"
          title={dict?.["admin.studio.elements"]}
        >
          <Plus className="size-4" />
        </button>

        {/* Undo / Redo */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="flex size-7 items-center justify-center rounded transition-colors hover:bg-[#27272a] disabled:opacity-35"
          title={dict?.["admin.studio.undo"]}
        >
          <Undo2 className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className="flex size-7 items-center justify-center rounded transition-colors hover:bg-[#27272a] disabled:opacity-35"
          title={dict?.["admin.studio.redo"]}
        >
          <Redo2 className="size-3.5" />
        </button>

        {/* Starter Templates Button */}
        <button
          type="button"
          onClick={onOpenTemplatesModal}
          className="flex size-7 items-center justify-center rounded transition-colors hover:bg-[#27272a]"
          title={dict?.["admin.studio.templates_library"]}
        >
          <FolderOpen className="size-3.5" />
        </button>

        {/* Page Settings Button */}
        <button
          type="button"
          onClick={onOpenPageSettings}
          className="flex size-7 items-center justify-center rounded transition-colors hover:bg-[#27272a]"
          title={dict?.["admin.studio.page_settings"]}
        >
          <Settings2 className="size-3.5" />
        </button>
      </div>

      {/* Center Document Switcher + Responsive Breakpoints */}
      <div className="flex items-center gap-2">
        {/* Document Switcher Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDocMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded bg-[#27272a] px-3 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-[#3f3f46]"
          >
            {isFrontPage && <Home className="size-3 text-emerald-400" />}
            <span className="max-w-[160px] truncate">{pageTitle}</span>
            <ChevronDown className="size-3 text-slate-400" />
          </button>

          {docMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDocMenuOpen(false)}
              />
              <div className="absolute start-0 top-9 z-50 max-h-80 w-64 overflow-y-auto rounded-md border border-[#27272a] bg-[#1f1f23] py-1.5 text-xs text-slate-200 shadow-2xl">
                <div className="border-b border-[#27272a] px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {dict?.["admin.studio.switch_page"]}
                </div>
                {allPages.map((p) => (
                  <Link
                    onNavigate={handleNavigation}
                    key={p.id}
                    href={`/admincp/studio/${p.id}`}
                    onClick={() => setDocMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 hover:bg-[#2d2d33] ${
                      p.id === pageId
                        ? "bg-[#27272a] font-semibold text-white"
                        : ""
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    {p.id === pageId && (
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                ))}
                <div className="mt-1 border-t border-[#27272a] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDocMenuOpen(false)
                      onOpenPageSettings()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-blue-400 hover:bg-[#2d2d33]"
                  >
                    <Settings2 className="size-3.5" />
                    <span>{dict?.["admin.studio.page_settings"]}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Viewport Device Switcher */}
        <div className="flex h-12 items-center border-x border-[#27272a] px-2">
          <button
            type="button"
            onClick={() => onDeviceChange("desktop")}
            className={`relative flex h-12 items-center justify-center px-2.5 transition-colors ${
              device === "desktop"
                ? "text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title={dict?.["admin.customizer.device_desktop"]}
          >
            <Monitor className="size-4" />
            {device === "desktop" && (
              <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDeviceChange("tablet")}
            className={`relative flex h-12 items-center justify-center px-2.5 transition-colors ${
              device === "tablet"
                ? "text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title={dict?.["admin.customizer.device_tablet"]}
          >
            <Tablet className="size-4" />
            {device === "tablet" && (
              <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDeviceChange("mobile")}
            className={`relative flex h-12 items-center justify-center px-2.5 transition-colors ${
              device === "mobile"
                ? "text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title={dict?.["admin.customizer.device_mobile"]}
          >
            <Smartphone className="size-4" />
            {device === "mobile" && (
              <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-white" />
            )}
          </button>
        </div>
      </div>

      {/* Right Actions: Language Switcher, Structure, Preview, Publish */}
      <div className="flex items-center gap-1.5">
        {languages.length > 1 && (
          <div className="me-1 flex items-center rounded bg-[#27272a] p-0.5 text-[10px] font-bold">
            <span>{dict?.["admin.studio.content.preview_language"] || ""}</span>
            {languages.map((lang) => {
              const isCurrent = activeLocale === lang.code
              return (
                <Link
                  key={lang.code}
                  href={`/admincp/studio/${pageId}?lang=${lang.code}`}
                  onNavigate={handleNavigation}
                  className={`rounded px-2 py-1 uppercase transition-colors ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title={lang.nativeName || lang.name}
                >
                  {lang.code.toUpperCase()}
                </Link>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onToggleStructure}
          className={`flex size-8 items-center justify-center rounded transition-colors ${
            isStructureOpen
              ? "bg-[#27272a] text-white"
              : "text-slate-300 hover:bg-[#27272a]"
          }`}
          title={dict?.["admin.studio.structure"]}
        >
          <Layers className="size-4" />
        </button>

        <button
          type="button"
          onClick={onTogglePreview}
          className={`flex size-8 items-center justify-center rounded transition-colors ${
            isPreviewMode
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:bg-[#27272a]"
          }`}
          title={dict?.["admin.studio.preview"]}
        >
          {isPreviewMode ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </button>

        {/* Publish Split Button */}
        <div className="relative ms-1 flex items-center">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onPublish({ status: "publish" })}
            className="h-8 rounded-s bg-[#a7f3d0] px-3.5 text-xs font-bold text-[#064e3b] transition-colors hover:bg-[#6ee7b7] disabled:opacity-50"
          >
            {isSaving
              ? dict?.["admin.customizer.publishing"]
              : dict?.["admin.customizer.publish"]}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setPublishMenuOpen((v) => !v)}
            className="flex h-8 items-center justify-center rounded-e border-s border-[#064e3b]/20 bg-[#a7f3d0] px-1.5 text-[#064e3b] transition-colors hover:bg-[#6ee7b7]"
          >
            <ChevronDown className="size-3.5" />
          </button>

          {publishMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPublishMenuOpen(false)}
              />
              <div className="absolute end-0 top-9 z-50 w-56 rounded-md border border-[#27272a] bg-[#1f1f23] py-1.5 text-xs text-slate-200 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setPublishMenuOpen(false)
                    onPublish({ status: "draft" })
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start hover:bg-[#2d2d33]"
                >
                  <History className="size-3.5 text-slate-400" />
                  <span>{dict?.["admin.studio.save_draft"]}</span>
                </button>
                {canAssignHomepage && (
                  <button
                    type="button"
                    onClick={() => {
                      setPublishMenuOpen(false)
                      onPublish({ status: "publish", setAsFrontPage: true })
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-start font-semibold text-emerald-400 hover:bg-[#2d2d33]"
                  >
                    <Home className="size-3.5" />
                    <span>{dict?.["admin.studio.publish_as_homepage"]}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
