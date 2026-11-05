import { queryOptions } from "@tanstack/react-query"
import type { StudioContentRequest } from "@/db/schema/cms-studio-content"
import { studioContentRequestKey, type StudioContentResult } from "./content"

export function studioContentQueryOptions(request: StudioContentRequest) {
  return queryOptions({
    queryKey: ["studio", "content", studioContentRequestKey(request)] as const,
    queryFn: async ({ signal }): Promise<StudioContentResult> => {
      const params = new URLSearchParams(
        Object.entries(request)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      )
      const response = await fetch(`/api/admin/studio/content?${params}`, {
        signal,
        credentials: "same-origin",
        cache: "no-store",
      })
      if (!response.ok) throw new Error("studio_content_failed")
      const result = (await response.json()) as StudioContentResult
      return {
        ...result,
        items: result.items.map((item) => ({
          ...item,
          date: new Date(item.date),
        })),
      }
    },
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
