"use client"

import Image from "next/image"
import type { ComponentPropsWithoutRef } from "react"
import { isOptimizableUpload } from "@/lib/media-images"
import { safeMediaUrl } from "@/lib/post-media"

type Props = Omit<
  ComponentPropsWithoutRef<"img">,
  "src" | "width" | "height"
> & { src: string; width?: number; height?: number }

/** Optimize trusted local uploads; external CMS images never become arbitrary server fetches. */
export function ContentImage({
  src,
  alt = "",
  width,
  height,
  srcSet,
  sizes = "100vw",
  loading = "lazy",
  ...props
}: Props) {
  if (!safeMediaUrl(src)) return null
  const local = isOptimizableUpload(src)
  if (!local)
    return (
      <img
        {...props}
        src={src}
        alt={alt}
        width={width}
        height={height}
        srcSet={srcSet}
        sizes={sizes}
        loading={loading}
      />
    )
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      width={width || 1200}
      height={height || 675}
      sizes={sizes}
      loading={loading}
    />
  )
}
