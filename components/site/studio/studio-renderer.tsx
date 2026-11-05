"use client"

import React from "react"
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripHorizontal,
  Plus,
  Trash2,
} from "lucide-react"
import type { StudioElement, StudioWidgetType } from "@/lib/studio/types"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"

import { buildElementInlineStyles, getShadowClass } from "./studio-styles"
import { StudioWidget } from "./studio-widget"
import type { StudioContentSnapshot } from "@/lib/studio/content"
import { getStudioElementContentRequest } from "@/lib/studio/content"
import { StudioContentRefresh } from "./studio-content-refresh"
import { useStudioDrag, StudioDropIndicator } from "./studio-drag"
import type { StudioDropPosition } from "@/lib/studio/relocate"

interface StudioRendererProps {
  widgetContent?: StudioContentSnapshot
  liveContent?: boolean
  contentLocale?: string
  pageLocale?: string
  elements: StudioElement[]
  posts: ContentItem[]
  theme: FrontEndThemeContext
  isEditor?: boolean
  selectedId?: string | null
  onSelectElement?: (id: string) => void
  onMoveElement?: (id: string, dir: "up" | "down") => void
  onRelocateElement?: (
    source: string,
    target: string,
    position: StudioDropPosition
  ) => void
  onDuplicateElement?: (id: string) => void
  onDeleteElement?: (id: string) => void
  onDropWidgetIntoContainer?: (
    containerId: string,
    widgetType: StudioWidgetType
  ) => void
  onOpenElementsForContainer?: (containerId: string) => void
  dict?: Record<string, string>
}

export function StudioRenderer({
  widgetContent,
  liveContent = false,
  contentLocale,
  pageLocale,
  elements,
  posts,
  theme,
  isEditor = false,
  selectedId = null,
  onSelectElement,
  onMoveElement,
  onRelocateElement,
  onDuplicateElement,
  onDeleteElement,
  onDropWidgetIntoContainer,
  onOpenElementsForContainer,
  dict,
}: StudioRendererProps) {
  const drag = useStudioDrag(
    isEditor,
    theme.direction === "rtl",
    elements,
    onRelocateElement,
    onDropWidgetIntoContainer
  )

  const renderElementNode = (
    el: StudioElement,
    isChildColumn = false
  ): React.ReactNode => {
    if (el.hidden && !isEditor) return null

    const isSelected = isEditor && selectedId === el.id
    const isDragOver = isEditor && drag.over?.id === el.id
    const inlineStyles = buildElementInlineStyles(el, isChildColumn)
    const shadowClass = getShadowClass(el.settings.boxShadow)
    const visibilityClasses = [
      el.settings.hideOnDesktop ? "lg:hidden" : "",
      el.settings.hideOnTablet ? "md:max-lg:hidden" : "",
      el.settings.hideOnMobile ? "max-md:hidden" : "",
      el.hidden && isEditor ? "opacity-40" : "",
    ]
      .filter(Boolean)
      .join(" ")

    if (el.elType === "container") {
      const cType = el.settings.containerType || "flexbox"
      const isBoxed = el.settings.contentWidth !== "full" && !isChildColumn
      const hasChildContainers = el.elements.some(
        (c) => c.elType === "container"
      )
      const gapPx = el.settings.gap ?? (isChildColumn ? 16 : 24)

      const innerLayoutStyle: React.CSSProperties =
        cType === "grid"
          ? {
              display: "grid",
              gridTemplateColumns: `repeat(${el.settings.gridColumns || 3}, minmax(0, 1fr))`,
              gap: `${gapPx}px`,
            }
          : cType === "flexbox"
            ? {
                display: "flex",
                flexDirection:
                  el.settings.flexDirection ||
                  (hasChildContainers ? "row" : "column"),
                justifyContent: el.settings.justifyContent || "flex-start",
                alignItems: el.settings.alignItems || "stretch",
                flexWrap:
                  el.settings.flexWrap ||
                  (hasChildContainers ? "nowrap" : "nowrap"),
                gap: `${gapPx}px`,
              }
            : {
                display: "block",
              }

      return (
        <div
          data-studio-element={el.id}
          key={el.id}
          id={el.settings.customId || undefined}
          style={inlineStyles}
          onClick={(e) => {
            if (!isEditor) return
            e.stopPropagation()
            onSelectElement?.(el.id)
          }}
          {...drag.target(el)}
          className={`relative transition-all ${shadowClass} ${visibilityClasses} ${
            el.settings.customClass || ""
          } ${
            isEditor
              ? `group/con cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-[#2563eb]"
                    : isDragOver
                      ? "bg-emerald-50/20 ring-2 ring-emerald-500"
                      : isChildColumn
                        ? "outline outline-1 -outline-offset-1 outline-slate-300/80 outline-dashed hover:outline-[#2563eb]"
                        : "outline outline-1 -outline-offset-1 outline-transparent hover:outline-[#2563eb]/70"
                }`
              : ""
          }`}
        >
          {isDragOver && drag.over && (
            <StudioDropIndicator position={drag.over.position} />
          )}
          {/* Floating Container Toolbar in Editor Mode */}
          {isEditor && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute start-1/2 -top-6 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-t bg-[#2563eb] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm transition-opacity ${
                isSelected
                  ? "opacity-100"
                  : "opacity-0 group-hover/con:opacity-100"
              }`}
            >
              <span
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                    event.preventDefault()
                    onMoveElement?.(
                      el.id,
                      event.key === "ArrowUp" ? "up" : "down"
                    )
                  }
                }}
                {...drag.handle(el.id)}
                data-studio-drag-handle={el.id}
                title={dict?.["admin.studio.action.drag"]}
                aria-label={dict?.["admin.studio.action.drag"]}
                className="cursor-grab touch-none rounded p-0.5 active:cursor-grabbing"
              >
                <GripHorizontal className="size-3" />
              </span>
              <span className="pe-1">
                {el.title ||
                  (isChildColumn
                    ? dict?.["admin.studio.el.column"]
                    : dict?.[`admin.studio.el.${cType}`] || cType)}
              </span>
              <button
                type="button"
                onClick={() => onMoveElement?.(el.id, "up")}
                className="rounded p-0.5 hover:bg-white/20"
                title={dict?.["admin.studio.action.move_up"]}
              >
                <ArrowUp className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => onMoveElement?.(el.id, "down")}
                className="rounded p-0.5 hover:bg-white/20"
                title={dict?.["admin.studio.action.move_down"]}
              >
                <ArrowDown className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => onDuplicateElement?.(el.id)}
                className="rounded p-0.5 hover:bg-white/20"
                title={dict?.["admin.studio.action.duplicate"]}
              >
                <Copy className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteElement?.(el.id)}
                className="rounded p-0.5 hover:bg-red-500"
                title={dict?.["admin.studio.action.delete"]}
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          )}

          <div
            style={{
              maxWidth: isBoxed
                ? `${el.settings.maxWidth || 1280}px`
                : undefined,
            }}
            className={isBoxed ? "mx-auto w-full" : "w-full"}
          >
            {el.elements.length > 0 ? (
              <div
                style={innerLayoutStyle}
                className={
                  hasChildContainers && cType === "flexbox"
                    ? "max-md:!flex-col"
                    : cType === "grid"
                      ? "max-md:!grid-cols-1"
                      : ""
                }
              >
                {el.elements.map((child) =>
                  renderElementNode(child, child.elType === "container")
                )}
              </div>
            ) : isEditor ? (
              /* Empty Column / Container Dropzone (Matching Screenshot 2!) */
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectElement?.(el.id)
                  onOpenElementsForContainer?.(el.id)
                }}
                className="flex min-h-[110px] w-full flex-col items-center justify-center rounded bg-[#f1f3f5]/80 text-[#64748b] transition-colors hover:bg-[#e9ecef]"
              >
                <Plus className="size-5 stroke-[1.75]" />
              </button>
            ) : null}
          </div>
        </div>
      )
    }

    // Widget Node
    const contentRequest =
      isEditor && liveContent
        ? getStudioElementContentRequest(
            el,
            contentLocale || theme.locale || theme.defaultLocale || ""
          )
        : undefined
    return (
      <div
        data-studio-element={el.id}
        key={el.id}
        id={el.settings.customId || undefined}
        style={inlineStyles}
        {...drag.target(el)}
        onClick={(e) => {
          if (!isEditor) return
          e.stopPropagation()
          onSelectElement?.(el.id)
        }}
        className={`relative transition-all ${shadowClass} ${visibilityClasses} ${
          el.settings.customClass || ""
        } ${
          isEditor
            ? `group/wid cursor-pointer ${
                isSelected
                  ? "ring-2 ring-[#2563eb]"
                  : "hover:ring-1 hover:ring-[#2563eb]/80"
              }`
            : ""
        }`}
      >
        {isDragOver && drag.over && (
          <StudioDropIndicator position={drag.over.position} />
        )}
        {isEditor && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute end-0 top-0 z-30 flex items-center gap-0.5 rounded-bl bg-[#2563eb] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm transition-opacity ${
              isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/wid:opacity-100"
            }`}
          >
            <span
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                  event.preventDefault()
                  onMoveElement?.(
                    el.id,
                    event.key === "ArrowUp" ? "up" : "down"
                  )
                }
              }}
              {...drag.handle(el.id)}
              data-studio-drag-handle={el.id}
              title={dict?.["admin.studio.action.drag"]}
              aria-label={dict?.["admin.studio.action.drag"]}
              className="cursor-grab touch-none rounded p-0.5 active:cursor-grabbing"
            >
              <GripHorizontal className="size-2.5" />
            </span>
            {contentRequest && (
              <StudioContentRefresh request={contentRequest} dict={dict} />
            )}
            <button
              type="button"
              onClick={() => onMoveElement?.(el.id, "up")}
              className="rounded p-0.5 hover:bg-white/20"
              title={dict?.["admin.studio.action.move_up"]}
            >
              <ArrowUp className="size-2.5" />
            </button>
            <button
              type="button"
              onClick={() => onMoveElement?.(el.id, "down")}
              className="rounded p-0.5 hover:bg-white/20"
              title={dict?.["admin.studio.action.move_down"]}
            >
              <ArrowDown className="size-2.5" />
            </button>
            <button
              type="button"
              onClick={() => onDuplicateElement?.(el.id)}
              className="rounded p-0.5 hover:bg-white/20"
              title={dict?.["admin.studio.action.duplicate"]}
            >
              <Copy className="size-2.5" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteElement?.(el.id)}
              className="rounded p-0.5 hover:bg-red-500"
              title={dict?.["admin.studio.action.delete"]}
            >
              <Trash2 className="size-2.5" />
            </button>
          </div>
        )}

        {
          <StudioWidget
            widgetContent={widgetContent}
            liveContent={liveContent}
            contentLocale={contentLocale}
            pageLocale={pageLocale}
            element={el}
            posts={posts}
            theme={theme}
            isEditor={isEditor}
            dict={dict}
          />
        }
      </div>
    )
  }

  return (
    <div className="w-full">
      {elements.map((el) => renderElementNode(el, false))}
    </div>
  )
}
