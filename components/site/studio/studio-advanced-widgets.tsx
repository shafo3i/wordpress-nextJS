import { getSafeStudioUrl } from "@/lib/studio/urls"
import {
  sanitizeStudioMarkup,
  sanitizeStudioWidgetConfig,
} from "@/lib/studio/sanitize"

import { Anchor, ArrowRight, Star } from "lucide-react"

import { SidebarWidgetRenderer } from "@/components/site/sidebar/sidebar-renderer"
import type { WidgetItem } from "@/widgets/types"

import type { StudioWidgetProps } from "./studio-widget-types"

import {
  AtomicTabsView,
  AtomicAccordionView,
} from "./studio-interactive-widgets"
export function StudioAdvancedWidgets({
  element: el,
  posts,
  theme,
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
    case "soundcloud": {
      const url = getSafeStudioUrl(s.soundcloudUrl, true)
      if (!url) return null
      const trackUrl = encodeURIComponent(url)
      return (
        <div className="w-full overflow-hidden rounded-lg border border-theme-border">
          <iframe
            title={dict?.["admin.studio.el.soundcloud"]}
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${trackUrl}&color=%232563eb&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
          />
        </div>
      )
    }

    case "shortcode": {
      return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {s.shortcodeText || "[shortcode]"}
        </div>
      )
    }

    case "menu_anchor": {
      return (
        <div id={s.anchorId || "anchor"} className="w-full">
          {isEditor && (
            <div className="flex items-center gap-2 rounded border border-dashed border-indigo-300 bg-indigo-50/50 px-3 py-1.5 font-mono text-[11px] text-indigo-700">
              <Anchor className="size-3.5" />
              <span>#{s.anchorId || "anchor"}</span>
            </div>
          )}
        </div>
      )
    }

    case "sidebar": {
      const item: WidgetItem = {
        id: el.id,
        type: s.widgetId || "recent_posts",
        title: s.widgetTitle || "",
        config: sanitizeStudioWidgetConfig(s.widgetConfig),
      }
      return (
        <div className="w-full">
          <SidebarWidgetRenderer item={item} theme={theme} posts={posts} />
        </div>
      )
    }

    case "read_more": {
      const label = s.buttonText || dict?.["admin.studio.el.read_more"] || ""
      return (
        <div className={alignClass}>
          <a
            href={isEditor ? undefined : getSafeStudioUrl(s.buttonUrl) || "#"}
            onClick={(e) => isEditor && e.preventDefault()}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline"
          >
            <span>{label}</span>
            <ArrowRight className="size-4" />
          </a>
        </div>
      )
    }

    case "rating": {
      const rating = s.ratingValue ?? 0
      const max = Math.min(20, Math.max(1, Math.floor(s.ratingMax ?? 5)))
      return (
        <div
          className={`flex items-center gap-2 ${
            s.align === "center"
              ? "justify-center"
              : s.align === "end"
                ? "justify-end"
                : "justify-start"
          }`}
        >
          <div className="flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: max }).map((_, idx) => (
              <Star
                key={idx}
                className={`size-4 ${
                  idx < Math.round(rating) ? "fill-amber-400" : "text-slate-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-theme-heading">
            {rating}/{max}
          </span>
          {s.text && (
            <span className="text-xs text-theme-muted">({s.text})</span>
          )}
        </div>
      )
    }

    case "text_path": {
      const pathText = s.text || ""
      return (
        <div
          className={`flex w-full ${s.align === "center" ? "justify-center" : ""}`}
        >
          <svg
            viewBox="0 0 500 120"
            className="h-28 w-full max-w-md overflow-visible"
          >
            <path
              id={`tp-${el.id}`}
              d="M 20,90 Q 250,10 480,90"
              fill="transparent"
            />
            <text className="fill-current text-[15px] font-bold tracking-widest text-theme-heading">
              <textPath
                href={`#tp-${el.id}`}
                startOffset="50%"
                textAnchor="middle"
              >
                {pathText}
              </textPath>
            </text>
          </svg>
        </div>
      )
    }

    case "tabs":
      return <AtomicTabsView el={el} dict={dict} />

    case "accordion":
      return <AtomicAccordionView el={el} dict={dict} />

    case "svg":
      return (
        <div
          className={`flex w-full ${
            s.align === "center"
              ? "justify-center"
              : s.align === "end"
                ? "justify-end"
                : "justify-start"
          }`}
          style={{ color: s.textColor || undefined }}
          dangerouslySetInnerHTML={{
            __html: sanitizeStudioMarkup(s.svgCode, true),
          }}
        />
      )

    case "html":
      if (!s.htmlCode && isEditor) {
        return (
          <div className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500">
            {dict?.["admin.studio.placeholder.html"] || ""}
          </div>
        )
      }
      return (
        <div
          className="prose dark:prose-invert w-full max-w-none"
          dangerouslySetInnerHTML={{
            __html: sanitizeStudioMarkup(s.htmlCode),
          }}
        />
      )
    default:
      return null
  }
}
