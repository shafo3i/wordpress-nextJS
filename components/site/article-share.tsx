"use client"
import { useState } from "react"
import { Check, Copy, Mail, Share2 } from "lucide-react"
import { articleShareLinks } from "@/lib/article-sharing"
import type { ThemeMods } from "@/lib/themes/types"

async function copyArticleUrl(url: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url)
      return
    } catch {
      /* HTTP staging and denied clipboard permissions need the fallback. */
    }
  }
  const input = document.createElement("textarea")
  input.value = url
  input.readOnly = true
  input.style.position = "fixed"
  input.style.opacity = "0"
  const previous = document.activeElement
  document.body.append(input)
  input.select()
  try {
    if (!document.execCommand("copy")) throw new Error("copy_failed")
  } finally {
    input.remove()
    if (previous instanceof HTMLElement) previous.focus()
  }
}

export function ArticleShare({
  title,
  url,
  mods,
  dict = {},
}: {
  title: string
  url: string
  mods: ThemeMods
  dict?: Record<string, string>
}) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const links = articleShareLinks(url, title)
  const button =
    "rounded p-1.5 border border-theme-border bg-theme-surface hover:opacity-80 text-theme-text transition-colors cursor-pointer"
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      aria-label={dict["site.share"]}
    >
      <span className="hidden text-[0.6875rem] font-medium text-theme-muted sm:inline">
        {dict["site.share"]}
      </span>
      {links &&
        (
          [
            ["facebook", "singleShareFacebook"],
            ["x", "singleShareX"],
            ["whatsapp", "singleShareWhatsapp"],
            ["telegram", "singleShareTelegram"],
            ["linkedin", "singleShareLinkedin"],
            ["email", "singleShareEmail"],
          ] as const
        )
          .filter(([, setting]) => mods[setting] !== false)
          .map(([network]) => (
            <a
              key={network}
              href={links[network]}
              target={network === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={button}
              aria-label={dict[`site.share.${network}`]}
              title={dict[`site.share.${network}`]}
            >
              {network === "email" ? (
                <Mail aria-hidden className="size-3.5" />
              ) : (
                <span className="text-xs font-semibold">
                  {dict[`site.network.${network}`]}
                </span>
              )}
            </a>
          ))}
      {mods.singleShareNative !== false && (
        <button
          type="button"
          className={button}
          aria-label={dict["site.share.native"]}
          title={dict["site.share.native"]}
          onClick={async () => {
            try {
              if (navigator.share) await navigator.share({ title, url })
              else {
                await copyArticleUrl(url)
                setCopied(true)
                setError(false)
              }
            } catch (cause) {
              if (!(
                cause instanceof DOMException && cause.name === "AbortError"
              ))
                setError(true)
            }
          }}
        >
          <Share2 aria-hidden className="size-3.5" />
        </button>
      )}
      {mods.singleShareCopy !== false && (
        <button
          type="button"
          className={button}
          title={dict["site.copy_link"]}
          aria-label={dict["site.copy_link"]}
          onClick={async () => {
            try {
              await copyArticleUrl(url)
              setCopied(true)
              setError(false)
            } catch {
              setError(true)
            }
          }}
        >
          {copied ? (
            <Check aria-hidden className="size-3.5" />
          ) : (
            <Copy aria-hidden className="size-3.5" />
          )}
        </button>
      )}
      <span className="sr-only" role="status">
        {copied ? dict["site.share.copied"] : ""}
      </span>
      {error && (
        <span role="alert" className="text-xs text-theme-danger">
          {dict["site.share.failed"]}
        </span>
      )}
    </div>
  )
}
