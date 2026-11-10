"use client"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { syncLanguageTemplatesAction } from "../action"
export function LanguageSync({ dict }: { dict: Record<string, string> }) {
  const router = useRouter(),
    [message, setMessage] = useState("")
  const sync = useMutation({
    mutationFn: syncLanguageTemplatesAction,
    onSuccess: (result) => {
      setMessage(
        result.success
          ? dict["admin.languages.sync_result"]
              .replace("{added}", String(result.added))
              .replace("{preserved}", String(result.preserved))
              .replace("{missing}", String(result.missing))
          : dict["admin.languages.sync_failed"]
      )
      if (result.success) router.refresh()
    },
    onError: () => setMessage(dict["admin.languages.sync_failed"]),
  })
  return (
    <section className="space-y-2">
      <button
        type="button"
        disabled={sync.isPending}
        onClick={() => sync.mutate()}
        className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] disabled:opacity-50"
      >
        {
          dict[
            sync.isPending ? "admin.languages.syncing" : "admin.languages.sync"
          ]
        }
      </button>
      <p className="text-xs text-[#646970]">
        {dict["admin.languages.sync_help"]}
      </p>
      {message && (
        <p
          role="status"
          className="border-s-4 border-[#2271b1] bg-white p-3 text-sm"
        >
          {message}
        </p>
      )}
    </section>
  )
}
