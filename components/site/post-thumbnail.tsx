"use client"
import { ContentImage } from "./content-image"
import type { ComponentProps } from "react"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import { isVideoPost } from "@/lib/post-video"
import styles from "./post-thumbnail.module.css"
export function PostThumbnail({
  post,
  theme,
  className,
  absolute,
  ...props
}: ComponentProps<typeof ContentImage> & {
  post: ContentItem
  theme?: FrontEndThemeContext
  absolute?: boolean
}) {
  const attributes = Object.fromEntries(
    Object.entries(props).filter(([key]) => key.startsWith("data-"))
  )
  return (
    <span
      {...attributes}
      className={`${styles.frame} ${className || ""}`}
      style={
        absolute || className?.split(" ").includes("absolute")
          ? { position: "absolute" }
          : undefined
      }
    >
      <ContentImage {...props} className={styles.image} />
      {isVideoPost(post) && (
        <span
          className={styles.play}
          role="img"
          aria-label={theme?.dict?.["site.video"] || ""}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M7 3v18l15-9z" />
          </svg>
        </span>
      )}
    </span>
  )
}
