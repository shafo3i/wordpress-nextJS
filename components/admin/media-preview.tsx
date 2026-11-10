"use client"
import { useState } from "react"
import { safeMediaUrl } from "@/lib/post-media"
export function MediaPreview({
  url,
  thumbnailUrl,
  alt = "",
  className = "",
  dict = {},
}: {
  url: string
  thumbnailUrl?: string
  alt?: string
  className?: string
  dict?: Record<string, string>
}) {
  const original = safeMediaUrl(url) || "",
    thumbnail = safeMediaUrl(thumbnailUrl || "") || original
  return (
    <PreviewImage
      key={`${thumbnail}|${original}`}
      original={original}
      thumbnail={thumbnail}
      alt={alt}
      className={className}
      unavailable={dict["admin.media.preview_unavailable"] || ""}
    />
  )
}
function PreviewImage({
  original,
  thumbnail,
  alt,
  className,
  unavailable,
}: {
  original: string
  thumbnail: string
  alt: string
  className: string
  unavailable: string
}) {
  const [fallback, setFallback] = useState(false),
    [failed, setFailed] = useState(false)
  if (failed || !original)
    return (
      <span
        role="img"
        aria-label={unavailable}
        className={`flex items-center justify-center p-3 text-center text-xs text-[#646970] ${className}`}
      >
        {unavailable}
      </span>
    )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fallback ? original : thumbnail}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (!fallback && thumbnail !== original) setFallback(true)
        else setFailed(true)
      }}
    />
  )
}
