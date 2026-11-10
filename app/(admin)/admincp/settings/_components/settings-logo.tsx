"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  SITE_LOGO_ACCEPT,
  SITE_LOGO_MAX_BYTES,
} from "@/db/schema/cms-site-logo"
import { removeSettingsLogoAction, selectSettingsLogoAction } from "../action"
import { MediaSelectModal } from "@/components/admin/media-select-modal"

export function useSettingsLogo(
  initialUrl: string,
  onSelectionChange?: () => void
) {
  const [url, setUrl] = useState(initialUrl)
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()
  const mutation = useMutation({
    mutationFn: async (file: File | null | { attachmentId: string }) => {
      if (file && !(file instanceof File)) {
        const result = await selectSettingsLogoAction(file.attachmentId)
        if (!result.success) throw new Error(result.error)
        return result.logo.url
      }
      if (!file) {
        const result = await removeSettingsLogoAction()
        if (!result.success) throw new Error(result.error)
        return ""
      }
      if (!file.size || file.size > SITE_LOGO_MAX_BYTES)
        throw new Error("admin.settings.logo.invalid_file")
      const data = new FormData()
      data.set("file", file)
      const response = await fetch("/api/admin/settings/logo", {
        method: "POST",
        credentials: "same-origin",
        body: data,
      })
      const result = await response.json()
      if (!response.ok || !result.logo?.url)
        throw new Error(result.error || "admin.settings.logo.upload_error")
      return result.logo.url as string
    },
    onSuccess: (value) => {
      setUrl(value)
      setFile(null)
      router.refresh()
    },
  })
  return {
    url,
    file,
    mutation,
    chooseFile: (value: File | null) => {
      setFile(value)
      mutation.reset()
      onSelectionChange?.()
    },
    savePending: async () => {
      if (file) await mutation.mutateAsync(file)
    },
  }
}

export function SettingsLogo({
  controller,
  dict,
  busy = false,
}: {
  controller: ReturnType<typeof useSettingsLogo>
  dict: Record<string, string>
  busy?: boolean
}) {
  const { url, file, mutation, chooseFile } = controller
  const [libraryOpen, setLibraryOpen] = useState(false)
  return (
    <fieldset
      disabled={busy || mutation.isPending}
      className="space-y-3 border-b border-[#c3c4c7] pb-6"
    >
      <legend className="text-[16px] font-semibold text-[#1d2327]">
        {dict["admin.settings.logo.title"]}
      </legend>
      <p className="text-[12px] text-[#646970]">
        {dict["admin.settings.logo.description"]}
      </p>
      {url && (
        <div className="inline-block rounded border border-[#c3c4c7] bg-[#f0f0f1] p-4">
          <img
            src={url}
            alt={dict["admin.settings.logo.preview"]}
            className="max-h-24 max-w-full object-contain"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1]"
        >
          {dict["admin.settings.logo.select_library"]}
        </button>
        <label className="space-y-1 text-[13px] text-[#1d2327]">
          <span className="block">{dict["admin.settings.logo.choose"]}</span>
          <input
            key={url}
            type="file"
            accept={SITE_LOGO_ACCEPT}
            onChange={(event) => {
              chooseFile(event.target.files?.[0] || null)
            }}
            className="block max-w-full text-[13px]"
          />
        </label>
        <button
          type="button"
          disabled={!file || mutation.isPending}
          onClick={() => {
            if (file) mutation.mutate(file)
          }}
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-3 text-[13px] text-white disabled:opacity-50"
        >
          {
            dict[
              mutation.isPending
                ? "admin.settings.logo.saving"
                : "admin.settings.logo.upload"
            ]
          }
        </button>
        {url && (
          <button
            type="button"
            onClick={() => mutation.mutate(null)}
            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-[#f6f7f7] px-3 text-[13px] text-[#b32d2e]"
          >
            {dict["admin.settings.logo.remove"]}
          </button>
        )}
      </div>
      <p className="text-[12px] text-[#646970]">
        {dict["admin.settings.logo.help"]}
      </p>
      {file && (
        <p role="status" className="text-[13px] text-[#996800]">
          {dict["admin.settings.logo.pending"]} <strong>{file.name}</strong>
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-[13px] text-[#b32d2e]">
          {dict[mutation.error.message] ||
            dict["admin.settings.logo.upload_error"]}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="text-[13px] text-[#008a20]">
          {dict["admin.settings.logo.saved"]}
        </p>
      )}
      <MediaSelectModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        mediaType="image"
        title={dict["admin.settings.logo.select_library"]}
        selectButtonText={dict["admin.settings.logo.apply_selected"]}
        dict={dict}
        onSelect={(item) => {
          setLibraryOpen(false)
          mutation.mutate({ attachmentId: String(item.id) })
        }}
      />
    </fieldset>
  )
}
