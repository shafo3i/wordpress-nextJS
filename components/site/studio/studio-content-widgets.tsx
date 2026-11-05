import { getSafeStudioUrl } from "@/lib/studio/urls"
import { getStudioHeadingTag } from "@/lib/studio/widget-registry"
import { createElement } from "react"

import type { StudioWidgetProps } from "./studio-widget-types"

export function StudioContentWidgets({
  element: el,
  isEditor = false,
  dict,
}: StudioWidgetProps) {
  const s = el.settings
  const alignClass =
    s.align === "center"
      ? "text-center"
      : s.align === "end"
        ? "text-end"
        : s.align === "justify"
          ? "text-justify"
          : "text-start"

  switch (el.widgetType) {
    case "heading": {
      const tag = getStudioHeadingTag(s.htmlTag)
      const text =
        s.text || (isEditor ? dict?.["admin.studio.placeholder.heading"] : "")
      return createElement(
        tag,
        {
          style: {
            fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
            fontWeight: s.fontWeight || "700",
            lineHeight: s.lineHeight || 1.25,
            letterSpacing: s.letterSpacing ? `${s.letterSpacing}px` : undefined,
            color: s.textColor || undefined,
          },
          className: `tracking-tight text-theme-heading ${alignClass}`,
        },
        text
      )
    }

    case "paragraph":
    case "text_editor": {
      const text =
        s.text || (isEditor ? dict?.["admin.studio.placeholder.paragraph"] : "")
      return (
        <p
          style={{
            fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
            fontWeight: s.fontWeight || "400",
            lineHeight: s.lineHeight || 1.7,
            color: s.textColor || undefined,
          }}
          className={`text-theme-text ${alignClass} whitespace-pre-line`}
        >
          {text}
        </p>
      )
    }

    case "image": {
      const src = getSafeStudioUrl(s.imageUrl, true)
      if (!src) return null
      return (
        <div className={`w-full overflow-hidden ${alignClass}`}>
          <img
            src={src}
            alt={s.imageAlt || ""}
            style={{
              height: s.imageHeight ? `${s.imageHeight}px` : undefined,
              objectFit: s.objectFit || "cover",
              borderRadius:
                s.borderRadius !== undefined
                  ? `${s.borderRadius}px`
                  : undefined,
            }}
            className="w-full"
          />
        </div>
      )
    }

    case "button": {
      const label =
        s.buttonText || dict?.["admin.studio.placeholder.button"] || ""
      const sizeClasses =
        s.buttonSize === "sm"
          ? "px-3.5 py-1.5 text-xs"
          : s.buttonSize === "lg"
            ? "px-7 py-3.5 text-base"
            : "px-5 py-2.5 text-sm"
      const variantClasses =
        s.buttonVariant === "outline"
          ? "border-2 border-current bg-transparent text-theme-heading hover:opacity-80"
          : s.buttonVariant === "secondary"
            ? "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-white"
            : s.buttonVariant === "dark"
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-blue-600 text-white hover:bg-blue-700"

      return (
        <div className={alignClass}>
          <a
            href={isEditor ? undefined : getSafeStudioUrl(s.buttonUrl) || "#"}
            onClick={(e) => {
              if (isEditor) e.preventDefault()
            }}
            style={{
              borderRadius:
                s.borderRadius !== undefined ? `${s.borderRadius}px` : "6px",
              backgroundColor: s.backgroundColor || undefined,
              color: s.textColor || undefined,
            }}
            className={`inline-flex items-center justify-center font-semibold transition-all ${sizeClasses} ${variantClasses}`}
          >
            {label}
          </a>
        </div>
      )
    }

    case "divider": {
      return (
        <div className="w-full py-2">
          <hr
            style={{
              borderTopStyle: s.dividerStyle || "solid",
              borderTopWidth: `${s.dividerWeight ?? 1}px`,
              borderColor: s.dividerColor || "#cbd5e1",
            }}
          />
        </div>
      )
    }

    case "spacer": {
      return (
        <div
          style={{ height: `${s.spacerHeight ?? 48}px` }}
          className={
            isEditor
              ? "bg-stripes flex w-full items-center justify-center border border-dashed border-slate-300/70 text-[10px] text-slate-400"
              : "w-full"
          }
        >
          {isEditor ? `${s.spacerHeight ?? 48}px` : null}
        </div>
      )
    }
    default:
      return null
  }
}
