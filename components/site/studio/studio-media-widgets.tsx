import { getSafeStudioUrl } from "@/lib/studio/urls"

import { Star } from "lucide-react"

import type { StudioWidgetProps } from "./studio-widget-types"

function toYoutubeEmbedUrl(value?: string): string {
  const url = getSafeStudioUrl(value, true)
  if (!url) return ""
  if (url.includes("youtube.com/embed/")) return url
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`
  }
  return url
}

export function StudioMediaWidgets({
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
    case "youtube":
    case "video": {
      const embedUrl = toYoutubeEmbedUrl(s.videoUrl)
      if (!embedUrl) return null
      const ratioClass =
        s.aspectRatio === "4/3"
          ? "aspect-4/3"
          : s.aspectRatio === "1/1"
            ? "aspect-square"
            : "aspect-video"
      return (
        <div
          style={{
            borderRadius:
              s.borderRadius !== undefined ? `${s.borderRadius}px` : "8px",
          }}
          className={`w-full overflow-hidden bg-slate-950 ${ratioClass}`}
        >
          <iframe
            src={embedUrl}
            title={dict?.["admin.studio.el.video"]}
            className="pointer-events-auto h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    case "google_maps": {
      if (!s.mapAddress) return null
      const address = encodeURIComponent(s.mapAddress)
      const zoom = s.mapZoom ?? 12
      return (
        <div
          style={{
            height: `${s.imageHeight || 320}px`,
            borderRadius:
              s.borderRadius !== undefined ? `${s.borderRadius}px` : "8px",
          }}
          className="relative w-full overflow-hidden border border-theme-border bg-slate-100"
        >
          <iframe
            title={dict?.["admin.studio.el.google_maps"]}
            src={`https://maps.google.com/maps?q=${address}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`}
            className="h-full w-full border-0"
            loading="lazy"
          />
        </div>
      )
    }

    case "icon": {
      const size = s.iconSize || 40
      return (
        <div
          className={`flex w-full ${
            s.align === "center"
              ? "justify-center"
              : s.align === "end"
                ? "justify-end"
                : "justify-start"
          }`}
        >
          <div
            style={{ color: s.textColor || "#2563eb" }}
            className="inline-flex items-center justify-center rounded-full bg-blue-500/10 p-3"
          >
            <Star style={{ width: size, height: size }} />
          </div>
        </div>
      )
    }

    case "image_box": {
      const src = getSafeStudioUrl(s.imageUrl, true)
      if (!src) return null
      const title =
        s.text ||
        (isEditor ? dict?.["admin.studio.placeholder.heading"] : "") ||
        ""
      const desc =
        s.subText ||
        (isEditor ? dict?.["admin.studio.placeholder.paragraph"] : "") ||
        ""
      return (
        <div
          className={`space-y-3 overflow-hidden rounded-xl border border-theme-border bg-theme-surface p-5 ${alignClass}`}
        >
          <img
            src={src}
            alt={title}
            className="h-48 w-full rounded-lg object-cover"
          />
          <h3 className="text-lg font-bold text-theme-heading">{title}</h3>
          <p className="text-sm leading-relaxed text-theme-muted">{desc}</p>
        </div>
      )
    }

    case "icon_box": {
      const title =
        s.text ||
        (isEditor ? dict?.["admin.studio.placeholder.heading"] : "") ||
        ""
      const desc =
        s.subText ||
        (isEditor ? dict?.["admin.studio.placeholder.paragraph"] : "") ||
        ""
      return (
        <div
          className={`space-y-3 rounded-xl border border-theme-border bg-theme-surface p-6 ${alignClass}`}
        >
          <div
            className={`inline-flex size-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600`}
            style={{ color: s.textColor || undefined }}
          >
            <Star className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-theme-heading">{title}</h3>
          <p className="text-sm leading-relaxed text-theme-muted">{desc}</p>
        </div>
      )
    }

    case "image_carousel":
    case "basic_gallery": {
      const imgs = (s.galleryImages || [])
        .map((url) => getSafeStudioUrl(url, true))
        .filter(Boolean)
      const cols = s.gridColumns || 3
      return (
        <div
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
          className="grid w-full gap-3"
        >
          {imgs.map((url, idx) => (
            <div
              key={idx}
              className="aspect-4/3 overflow-hidden rounded-lg border border-theme-border bg-slate-100"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}
