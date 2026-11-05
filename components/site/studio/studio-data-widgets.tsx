import { getSafeStudioUrl } from "@/lib/studio/urls"

import { AlertCircle, CheckCircle2, Info, Share2 } from "lucide-react"

import type { StudioWidgetProps } from "./studio-widget-types"

export function StudioDataWidgets({
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
    case "icon_list": {
      const items = s.tabsItems || []
      return (
        <ul className="space-y-2.5 text-sm text-theme-text">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 shrink-0 text-blue-600" />
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      )
    }

    case "counter": {
      const val = s.counterValue ?? 0
      const suffix = s.counterSuffix ?? ""
      const label = s.text || dict?.["admin.studio.el.counter"] || ""
      return (
        <div
          className={`rounded-xl border border-theme-border bg-theme-surface p-5 ${alignClass}`}
        >
          <div
            className="text-4xl font-extrabold tracking-tight text-blue-600"
            style={{ color: s.textColor || undefined }}
          >
            {val}
            {suffix}
          </div>
          <div className="mt-1 text-xs font-semibold tracking-wider text-theme-muted uppercase">
            {label}
          </div>
        </div>
      )
    }

    case "progress_bar": {
      const pct = Math.min(100, Math.max(0, s.progressPercent ?? 0))
      const label = s.text || dict?.["admin.studio.el.progress_bar"] || ""
      return (
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-theme-heading">
            <span>{label}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              style={{
                width: `${pct}%`,
                backgroundColor: s.textColor || "#2563eb",
              }}
              className="h-full rounded-full transition-all"
            />
          </div>
        </div>
      )
    }

    case "testimonial": {
      const quote =
        s.text ||
        (isEditor ? dict?.["admin.studio.placeholder.paragraph"] : "") ||
        ""
      return (
        <blockquote className="space-y-4 rounded-xl border border-theme-border bg-theme-surface p-6">
          <p className="text-base leading-relaxed text-theme-text italic">
            &ldquo;{quote}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            {s.testimonialAvatar && (
              <img
                src={getSafeStudioUrl(s.testimonialAvatar, true)}
                alt={s.testimonialName || ""}
                className="size-10 rounded-full object-cover"
              />
            )}
            <div>
              <div className="text-sm font-bold text-theme-heading">
                {s.testimonialName || ""}
              </div>
              <div className="text-xs text-theme-muted">
                {s.testimonialRole || ""}
              </div>
            </div>
          </div>
        </blockquote>
      )
    }

    case "social_icons": {
      const links = s.socialLinks || []
      return (
        <div
          className={`flex flex-wrap items-center gap-2.5 ${
            s.align === "center"
              ? "justify-center"
              : s.align === "end"
                ? "justify-end"
                : "justify-start"
          }`}
        >
          {links.map((lk, i) => (
            <a
              key={i}
              href={isEditor ? undefined : getSafeStudioUrl(lk.url)}
              onClick={(e) => isEditor && e.preventDefault()}
              className="inline-flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-heading transition-colors hover:border-blue-500 hover:text-blue-600"
            >
              <Share2 className="size-3.5" />
              <span className="capitalize">{lk.platform}</span>
            </a>
          ))}
        </div>
      )
    }

    case "alert": {
      const aType = s.alertType || "info"
      const styles =
        aType === "success"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
          : aType === "warning"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
            : aType === "danger"
              ? "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200"
              : "border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200"
      return (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 ${styles}`}
        >
          {aType === "danger" || aType === "warning" ? (
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
          ) : (
            <Info className="mt-0.5 size-5 shrink-0" />
          )}
          <div className="space-y-1 text-sm">
            <div className="font-bold">
              {s.text || dict?.["admin.studio.el.alert"] || ""}
            </div>
            {s.subText && <div className="text-xs opacity-85">{s.subText}</div>}
          </div>
        </div>
      )
    }
    default:
      return null
  }
}
