"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Folder,
  LayoutTemplate,
  Plus,
  Sparkles,
  X,
} from "lucide-react"
import type {
  StudioDocumentData,
  StudioPageTemplate,
  StudioStructurePreset,
  StudioWidgetType,
} from "@/lib/studio/types"
import { useStudioEditor } from "@/lib/studio/use-studio-editor"
import type { StudioPublishOptions } from "@/lib/studio/editor-store"

import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import type { AvailableWidgetDescriptor } from "@/lib/widgets/types"
import type { WidgetItem } from "@/lib/widgets/db"
import { ThemeDynamicStyles } from "@/components/site/theme-dynamic-styles"
import { SiteHeader } from "@/components/site/header/site-header"
import { SiteFooter } from "@/components/site/footer/site-footer"
import { StudioRenderer } from "@/components/site/studio/studio-renderer"
import { StudioTopBar } from "./studio-top-bar"
import { StudioLeftPanel } from "./studio-left-panel"
import { StudioStructurePanel } from "./studio-structure-panel"
import { saveStudioDocumentAction } from "../action"
import type {
  StudioCategory,
  StudioContentSnapshot,
} from "@/lib/studio/content"

interface StudioShellProps {
  canAssignHomepage?: boolean
  pageId: string
  initialTitle: string
  initialSlug: string
  initialStatus: string
  initialDocument: StudioDocumentData
  initialWidgetContent?: StudioContentSnapshot
  pageLocale?: string
  initialIsFrontPage: boolean
  allPages: { id: string; title: string }[]
  posts: ContentItem[]
  theme: FrontEndThemeContext
  categories: StudioCategory[]
  availableWidgets: AvailableWidgetDescriptor[]
  footerWidgets?: {
    col1?: WidgetItem[]
    col2?: WidgetItem[]
    col3?: WidgetItem[]
    col4?: WidgetItem[]
  }
  dict?: Record<string, string>
  direction?: "rtl" | "ltr"
  activeLocale?: string
  languages?: { code: string; name: string; nativeName?: string | null }[]
}

const STRUCTURE_PRESETS: {
  id: StudioStructurePreset
  bars: number[]
}[] = [
  { id: "100", bars: [100] },
  { id: "50_50", bars: [50, 50] },
  { id: "66_33", bars: [66, 34] },
  { id: "33_66", bars: [34, 66] },
  { id: "33_33_33", bars: [33, 33, 33] },
  { id: "25_50_25", bars: [25, 50, 25] },
  { id: "25_25_25_25", bars: [25, 25, 25, 25] },
  { id: "grid_3", bars: [33, 33, 33] },
]

export function StudioShell({
  canAssignHomepage = false,
  pageId,
  initialTitle,
  initialSlug,
  initialStatus,
  initialDocument,
  initialWidgetContent,
  pageLocale,
  initialIsFrontPage,
  allPages,
  posts,
  theme,
  categories,
  availableWidgets,
  footerWidgets,
  dict,
  direction = "ltr",
  activeLocale = "en",
  languages = [],
}: StudioShellProps) {
  const router = useRouter()
  const {
    state: editorState,
    store: editor,
    selectedElement,
    isDirty,
  } = useStudioEditor(
    { title: initialTitle, status: initialStatus, document: initialDocument },
    initialIsFrontPage
  )
  const { title: pageTitle, status: pageStatus, document } = editorState.present
  const { elements, pageTemplate } = document
  const { selectedId, panelMode, isSaving } = editorState
  const isFrontPage =
    editorState.isCurrentFrontPage || editorState.assignAsFrontPage
  const setPageTitle = editor.setTitle
  const setPageTemplate = editor.setTemplate
  const setIsFrontPage = editor.setFrontPage
  const setPanelMode = editor.setPanelMode
  const setSelectedId = editor.select
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  )
  const [isStructureOpen, setIsStructureOpen] = useState(true)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showPresetPicker, setShowPresetPicker] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    error: boolean
  } | null>(null)

  const handleUndo = editor.undo
  const handleRedo = editor.redo
  const handleSelectElement = editor.select
  const handleUpdateElement = editor.updateElement
  const handleUpdateSettings = editor.updateSettings
  const handleMoveElement = editor.move
  const handleDuplicateElement = editor.duplicate
  const handleDeleteElement = editor.delete
  const handleToggleHidden = editor.toggleHidden
  const handleDropWidgetIntoContainer = (
    containerId: string,
    widgetType: StudioWidgetType
  ) => editor.insert(widgetType, "all", containerId)
  const handleAddOrInsertWidget = (widgetType: StudioWidgetType) =>
    editor.insert(widgetType)
  const handleAddContainerPreset = (preset: StudioStructurePreset) => {
    editor.addPreset(preset)
    setShowPresetPicker(false)
  }
  const handleInsertStarterTemplate = (
    id: Parameters<typeof editor.insertTemplate>[0]
  ) => {
    editor.insertTemplate(id)
    setShowTemplatesModal(false)
  }

  const handlePublish = async (options?: StudioPublishOptions) => {
    const result = await editor.save(pageId, saveStudioDocumentAction, options)
    if (result.busy) return
    setToast({
      message:
        dict?.[
          result.success
            ? "admin.studio.saved_notice"
            : "admin.studio.save_failed"
        ] || "",
      error: !result.success,
    })
    if (result.success) {
      setTimeout(() => setToast(null), 3000)
      router.refresh()
    }
  }

  const viewportWidthClass =
    device === "mobile"
      ? "max-w-[390px]"
      : device === "tablet"
        ? "max-w-[768px]"
        : "w-full"

  return (
    <div
      dir={direction}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#e2e8f0]"
    >
      {/* Top Dark Toolbar */}
      <StudioTopBar
        canAssignHomepage={canAssignHomepage}
        confirmNavigation={() =>
          !isDirty ||
          window.confirm(dict?.["admin.studio.unsaved_changes"] || "")
        }
        pageId={pageId}
        pageTitle={pageTitle}
        pageSlug={initialSlug}
        pageStatus={pageStatus}
        pageTemplate={pageTemplate}
        isFrontPage={isFrontPage}
        allPages={allPages}
        device={device}
        onDeviceChange={setDevice}
        isStructureOpen={isStructureOpen}
        onToggleStructure={() => setIsStructureOpen((v) => !v)}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode((v) => !v)}
        canUndo={editorState.past.length > 0}
        canRedo={editorState.future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenAddElements={() => {
          editor.select(null)
          setPanelMode("elements")
        }}
        onOpenTemplatesModal={() => setShowTemplatesModal(true)}
        onOpenPageSettings={() => setShowPageSettingsModal(true)}
        onPublish={handlePublish}
        isSaving={isSaving}
        dict={dict}
        activeLocale={activeLocale}
        languages={languages}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role={toast.error ? "alert" : "status"}
          className={`fixed start-1/2 bottom-5 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-[#18181b] px-4 py-2 text-xs font-semibold shadow-2xl ${toast.error ? "border-red-500/30 text-red-400" : "border-emerald-500/30 text-emerald-400"}`}
        >
          {toast.error ? (
            <AlertCircle className="size-4" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Workspace: Left Panel + Live Interactive Canvas + Floating Structure Panel */}
      <div className="relative flex min-h-0 flex-1">
        {!isPreviewMode && (
          <StudioLeftPanel
            pageLocale={pageLocale}
            contentLocale={activeLocale}
            panelMode={panelMode}
            onSetPanelMode={setPanelMode}
            selectedElement={selectedElement}
            onAddOrInsertWidget={handleAddOrInsertWidget}
            onUpdateElement={handleUpdateElement}
            onUpdateSettings={handleUpdateSettings}
            onDuplicateElement={handleDuplicateElement}
            onDeleteElement={handleDeleteElement}
            categories={categories}
            availableWidgets={availableWidgets}
            dict={dict}
            direction={direction}
            languages={languages}
          />
        )}

        {/* Center Scrollable Live Canvas */}
        <main
          data-studio-canvas
          onClick={() => setSelectedId(null)}
          className="flex flex-1 justify-center overflow-y-auto bg-[#d4d8dd] p-0"
        >
          <div
            dir={theme.direction || "ltr"}
            className={`${viewportWidthClass} flex min-h-full flex-col bg-theme-bg text-theme-text shadow-2xl transition-all duration-200`}
          >
            {theme.mods && (
              <ThemeDynamicStyles
                mods={theme.mods}
                themeSlug={theme.themeSlug}
              />
            )}

            {pageTemplate !== "studio_canvas" && <SiteHeader theme={theme} />}

            <div
              className={
                pageTemplate === "studio_full_width" ||
                pageTemplate === "studio_canvas"
                  ? "flex-1"
                  : "flex-1 py-6"
              }
            >
              <StudioRenderer
                widgetContent={initialWidgetContent}
                contentLocale={activeLocale}
                pageLocale={pageLocale}
                liveContent
                elements={elements}
                posts={posts}
                theme={theme}
                isEditor={!isPreviewMode}
                selectedId={selectedId}
                onSelectElement={handleSelectElement}
                onMoveElement={handleMoveElement}
                onRelocateElement={editor.relocate}
                onDuplicateElement={handleDuplicateElement}
                onDeleteElement={handleDeleteElement}
                onDropWidgetIntoContainer={handleDropWidgetIntoContainer}
                onOpenElementsForContainer={(containerId) => {
                  setSelectedId(containerId)
                  setPanelMode("elements")
                }}
                dict={dict}
              />

              {/* Bottom Dashed Add-Section / Drag-Widget Box (Matching Screenshot 2!) */}
              {!isPreviewMode && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const raw = e.dataTransfer.getData(
                      "application/x-studio-widget"
                    )
                    if (raw) {
                      handleAddOrInsertWidget(raw as StudioWidgetType)
                    }
                  }}
                  className="mx-auto my-8 max-w-4xl px-4"
                >
                  <div className="rounded border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center shadow-xs">
                    {showPresetPicker ? (
                      <div className="space-y-4">
                        <div className="mx-auto flex max-w-md items-center justify-between">
                          <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                            {dict?.["admin.studio.select_structure"]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPresetPicker(false)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                          {STRUCTURE_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() =>
                                handleAddContainerPreset(preset.id)
                              }
                              className="group flex h-14 items-center gap-1 rounded border border-slate-200 bg-slate-50 p-2 transition-all hover:border-blue-500 hover:bg-blue-50"
                            >
                              {preset.bars.map((w, bIdx) => (
                                <div
                                  key={bIdx}
                                  style={{ width: `${w}%` }}
                                  className="h-full rounded-xs bg-slate-300 transition-colors group-hover:bg-blue-500"
                                />
                              ))}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowPresetPicker(true)}
                            className="flex size-10 items-center justify-center rounded-full bg-slate-200/80 text-slate-700 transition-colors hover:bg-slate-300"
                            title={dict?.["admin.builder.add_section"]}
                          >
                            <Plus className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowTemplatesModal(true)}
                            className="flex size-10 items-center justify-center rounded-full bg-slate-200/80 text-slate-700 transition-colors hover:bg-slate-300"
                            title={dict?.["admin.studio.templates_library"]}
                          >
                            <Folder className="size-4 fill-slate-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(null)
                              setPanelMode("elements")
                            }}
                            className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 transition-colors hover:bg-emerald-200"
                            title={dict?.["admin.studio.elements"]}
                          >
                            <Sparkles className="size-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                          {dict?.["admin.studio.drag_widget_here"]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {pageTemplate !== "studio_canvas" && (
              <SiteFooter theme={theme} footerWidgets={footerWidgets} />
            )}
          </div>
        </main>

        {/* Floating Structure (Navigator) Panel */}
        {!isPreviewMode && isStructureOpen && (
          <StudioStructurePanel
            elements={elements}
            selectedId={selectedId}
            onSelectElement={handleSelectElement}
            onMoveElement={handleMoveElement}
            onDuplicateElement={handleDuplicateElement}
            onDeleteElement={handleDeleteElement}
            onToggleHidden={handleToggleHidden}
            onClose={() => setIsStructureOpen(false)}
            dict={dict}
          />
        )}
      </div>

      {/* Starter Templates Library Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="size-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {dict?.["admin.studio.templates_library"]}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              {(
                [
                  {
                    id: "magazine_home",
                    titleKey: "admin.studio.template.magazine_home",
                    descKey: "admin.studio.template.magazine_home_desc",
                  },
                  {
                    id: "broadsheet_home",
                    titleKey: "admin.studio.template.broadsheet_home",
                    descKey: "admin.studio.template.broadsheet_home_desc",
                  },
                  {
                    id: "editorial_portal",
                    titleKey: "admin.studio.template.editorial_portal",
                    descKey: "admin.studio.template.editorial_portal_desc",
                  },
                  {
                    id: "landing_showcase",
                    titleKey: "admin.studio.template.landing_showcase",
                    descKey: "admin.studio.template.landing_showcase_desc",
                  },
                ] as const
              ).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleInsertStarterTemplate(tpl.id)}
                  className="flex flex-col items-start rounded-lg border border-slate-200 p-4 text-start transition-all hover:border-blue-600 hover:bg-blue-50/40"
                >
                  <span className="text-sm font-bold text-slate-900">
                    {dict?.[tpl.titleKey]}
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    {dict?.[tpl.descKey]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Settings Modal */}
      {showPageSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-white text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-sm font-bold text-slate-900">
                {dict?.["admin.studio.page_settings"]}
              </h3>
              <button
                type="button"
                onClick={() => setShowPageSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">
                  {dict?.["admin.posts.form.title"]}
                </label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">
                  {dict?.["admin.studio.page_layout_template"]}
                </label>
                <select
                  value={pageTemplate}
                  onChange={(e) =>
                    setPageTemplate(e.target.value as StudioPageTemplate)
                  }
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="studio_full_width">
                    {dict?.["admin.studio.template_full_width"]}
                  </option>
                  <option value="studio_canvas">
                    {dict?.["admin.studio.template_canvas"]}
                  </option>
                  <option value="default">
                    {dict?.["admin.studio.template_default"]}
                  </option>
                  <option value="with-sidebar">
                    {dict?.["admin.studio.template_sidebar"]}
                  </option>
                </select>
              </div>

              {(canAssignHomepage || editorState.isCurrentFrontPage) && (
                <label className="flex cursor-pointer items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    checked={isFrontPage}
                    disabled={editorState.isCurrentFrontPage}
                    onChange={(e) => setIsFrontPage(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">
                    {dict?.["admin.studio.set_as_homepage"]}
                  </span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowPageSettingsModal(false)}
                className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700"
              >
                {dict?.["admin.theme_settings.done"]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
