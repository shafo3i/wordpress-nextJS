"use client"

import { useEffect, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { Eye } from "lucide-react"

export function PostViews({
  postId,
  initialCount = 0,
  track = true,
  visible = true,
  label,
  locale,
}: {
  postId: string
  initialCount?: number
  track?: boolean
  visible?: boolean
  label: string
  locale: string
}) {
  const sent = useRef<string | null>(null)
  const { mutate, data } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(
        `/api/posts/${encodeURIComponent(id)}/view`,
        { method: "POST", credentials: "same-origin", cache: "no-store" }
      )
      if (!response.ok) throw new Error("view_tracking_failed")
      const result = (await response.json()) as { views: number }
      return { ...result, postId: id }
    },
    retry: false,
  })
  const count = data?.postId === postId ? data.views : initialCount
  useEffect(() => {
    if (!track || window.top !== window.self) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      clearTimeout(timer)
      if (
        document.visibilityState !== "visible" ||
        sent.current === postId ||
        (document as Document & { prerendering?: boolean }).prerendering
      )
        return
      timer = setTimeout(() => {
        if (document.visibilityState === "visible" && sent.current !== postId) {
          sent.current = postId
          mutate(postId)
        }
      }, 1500)
    }
    schedule()
    document.addEventListener("visibilitychange", schedule)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", schedule)
    }
  }, [postId, track, mutate])
  if (!visible) return null
  return (
    <span
      data-post-views
      data-view-count={count}
      className="inline-flex items-center gap-1 text-xs text-theme-muted"
    >
      <Eye className="size-3.5" aria-hidden="true" />
      <span>
        {count.toLocaleString(locale)} {label}
      </span>
    </span>
  )
}
