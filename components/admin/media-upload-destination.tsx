"use client"
import { useId } from "react"
import { useQuery } from "@tanstack/react-query"

export function MediaUploadDestination({ value, onChange, disabled, dict }: { value: "local" | "s3"; onChange: (value: "local" | "s3") => void; disabled?: boolean; dict: Record<string, string> }) {
  const id = useId()
  const availability = useQuery({
    queryKey: ["media-upload-destinations"], staleTime: 30000, retry: false,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/media/storage", { signal, cache: "no-store", credentials: "same-origin" })
      if (!response.ok) return false
      const result = await response.json()
      return result.s3 === true
    },
  })
  return <div className="flex flex-wrap items-center justify-center gap-2 text-[13px]">
    <label htmlFor={id}>{dict["admin.storage.destination"]}</label>
    <select id={id} value={value} disabled={disabled} onChange={event => onChange(event.target.value as "local" | "s3")} className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[#2c3338]">
      <option value="local">{dict["admin.storage.local"]}</option>
      <option value="s3" disabled={!availability.data}>{dict["admin.storage.s3"]}</option>
    </select>
    {!availability.isPending && !availability.data && <span className="text-xs text-[#646970]">{dict["admin.storage.not_configured"]}</span>}
  </div>
}
