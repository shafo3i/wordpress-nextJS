"use client"

import React, { useState } from "react"
import { CheckCircle2, Loader2, Mail } from "lucide-react"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { DEFAULT_THEME } from "@/components/site/utils"

/**
 * 13. NEWSLETTER SUBSCRIPTION STRIP
 */
export function NewsletterBlock({
  title,
  theme = DEFAULT_THEME,
  config,
  compact = false,
  source = "homepage_block",
}: {
  title: string
  source?: string
  compact?: boolean
  config?: { pitch?: string; buttonText?: string }
  theme?: FrontEndThemeContext
}) {
  const [website, setWebsite] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError(theme.dict?.["site.newsletter.invalid_email"] || "")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website,
          source,
          locale: theme.locale,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSubscribed(true)
      } else {
        setError(
          theme.dict?.[data.error] ||
            data.error ||
            theme.dict?.["site.newsletter.error"] ||
            ""
        )
      }
    } catch {
      setError(theme.dict?.["site.newsletter.error"] || "")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      className={`${compact ? "p-4" : "p-8"} theme-widget rounded-2xl border border-[var(--theme-widget-border,var(--theme-border))] bg-[var(--theme-widget-bg,var(--theme-surface))] text-center text-[var(--theme-widget-text,var(--theme-text))] shadow-sm`}
    >
      <Mail aria-hidden="true" className="mx-auto size-6" />
      <h3 className="theme-widget-title mt-2 mb-1 font-serif text-2xl font-bold text-[var(--theme-widget-title-color,var(--theme-heading))]">
        {title}
      </h3>
      <p className="mx-auto mb-5 max-w-lg text-xs leading-relaxed text-[var(--theme-muted)]">
        {config?.pitch || theme.dict?.["site.newsletter.description"]}
      </p>

      {subscribed ? (
        <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl border border-theme-success/30 bg-theme-success/10 p-3.5 text-xs font-semibold text-theme-success">
          <CheckCircle2 className="size-4 text-theme-success" />
          <span>{theme.dict?.["site.newsletter.check_email"]}</span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row"
        >
          <input
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
          />
          <input
            aria-label={theme.dict?.["site.newsletter.email"]}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={theme.dict?.["site.newsletter.email"]}
            className="theme-input flex-1 rounded px-4 py-2 text-xs text-[var(--theme-text)] placeholder:opacity-60 focus:border-[var(--theme-primary)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="theme-btn flex cursor-pointer items-center justify-center gap-1.5 rounded px-5 py-2 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              config?.buttonText || theme.dict?.["site.newsletter.subscribe"]
            )}
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-xs text-theme-danger">{error}</p>}
    </section>
  )
}
