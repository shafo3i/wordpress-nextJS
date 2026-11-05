"use client"

import { useIsFetching, useQueryClient } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { studioContentQueryOptions } from "@/lib/studio/content-query"
import type { StudioContentRequest } from "@/db/schema/cms-studio-content"

export function StudioContentRefresh({
  request,
  dict,
}: {
  request: StudioContentRequest
  dict?: Record<string, string>
}) {
  const client = useQueryClient()
  const queryKey = studioContentQueryOptions(request).queryKey
  const fetching = useIsFetching({ queryKey, exact: true }) > 0
  const label =
    dict?.[
      fetching ? "admin.studio.content.loading" : "admin.studio.content.refresh"
    ] || ""
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={fetching}
      onClick={() => void client.invalidateQueries({ queryKey, exact: true })}
      className="rounded p-0.5 hover:bg-white/20 disabled:opacity-50"
    >
      <RefreshCw className={`size-2.5 ${fetching ? "animate-spin" : ""}`} />
    </button>
  )
}
