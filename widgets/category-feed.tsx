"use client"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import type { ContentItem } from "@/lib/site-content"
import type { WidgetItem, WidgetRenderProps } from "./types"

export function WidgetCategoryFeed({ item, theme, count, children }: Pick<WidgetRenderProps, "theme"> & {
  item: WidgetItem; count: number; children: (posts: ContentItem[]) => ReactNode
}) {
  const categoryId = String(item.config?.categoryId || "")
  const locale = item.locale && item.locale !== "all" ? item.locale : theme?.locale || theme?.defaultLocale
  const limit = Number.isFinite(count) ? Math.max(1, Math.min(15, Math.trunc(count))) : 5
  const query = useQuery({
    queryKey: ["widget-category-posts", categoryId, locale || "", limit],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ categoryId, limit: String(limit) })
      if (locale) params.set("locale", locale)
      const response = await fetch(`/api/widgets/posts?${params}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]), credentials: "omit", cache: "no-store" })
      if (!response.ok) throw new Error("unavailable")
      const body = await response.json()
      if (!Array.isArray(body.posts) || body.posts.length > limit) throw new Error("invalid")
      return body.posts.map((post: Omit<ContentItem, "date" | "content"> & { date: string }): ContentItem => ({ ...post, date: new Date(post.date), content: "" }))
    },
    staleTime: 30_000, retry: 1, refetchOnWindowFocus: false,
  })
  if (query.isPending) return <p role="status" className="text-xs">{theme?.dict?.["site.widgets.loading"]}</p>
  if (query.isError) return <p role="status" className="text-xs">{theme?.dict?.["site.widgets.unavailable"]}</p>
  return children(query.data)
}
