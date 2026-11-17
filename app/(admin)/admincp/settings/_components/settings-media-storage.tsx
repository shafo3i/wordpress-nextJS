"use client"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { MediaStorageAdminView, MediaStorageSettings } from "@/db/schema/cms-media-storage"
import { saveMediaStorageAction, testMediaStorageAction, retryMediaStorageCleanupAction } from "../action"

export function SettingsMediaStorage({ initialSettings, dict }: { initialSettings: MediaStorageAdminView; dict: Record<string, string> }) {
  const queryClient = useQueryClient()
  const { credentialsConfigured: initialCredentials, ...initial } = initialSettings
  const [settings, setSettings] = useState<MediaStorageSettings>(initial)
  const [credentialsConfigured, setCredentialsConfigured] = useState(initialCredentials)
  const [accessKeyId, setAccessKeyId] = useState("")
  const [secretAccessKey, setSecretAccessKey] = useState("")
  const [message, setMessage] = useState("")
  const save = useMutation({
    mutationFn: () => saveMediaStorageAction({ settings, accessKeyId, secretAccessKey }),
    onSuccess: result => {
      setMessage(dict[result.success ? "admin.storage.saved" : "admin.storage.error"])
      if (result.success) { setAccessKeyId(""); setSecretAccessKey(""); setCredentialsConfigured(result.settings.credentialsConfigured); void queryClient.invalidateQueries({ queryKey: ["media-upload-destinations"] }) }
    }, onError: () => setMessage(dict["admin.storage.error"]),
  })
  const test = useMutation({ mutationFn: testMediaStorageAction, onSuccess: result => setMessage(dict[result.success ? "admin.storage.test_success" : "admin.storage.test_failed"]), onError: () => setMessage(dict["admin.storage.test_failed"]) })
  const cleanup = useMutation({ mutationFn: retryMediaStorageCleanupAction, onSuccess: result => setMessage(result.success ? dict["admin.storage.cleanup_result"].replace("{completed}", String(result.completed)).replace("{failed}", String(result.failed)) : dict["admin.storage.error"]), onError: () => setMessage(dict["admin.storage.error"]) })
  const busy = save.isPending || test.isPending || cleanup.isPending
  return <section className="space-y-4 rounded-[3px] border border-[#c3c4c7] bg-white p-6 text-[13px]">
    <h2 className="text-[16px] font-semibold">{dict["admin.storage.title"]}</h2>
    <p className="text-[#646970]">{dict["admin.storage.help"]}</p>
    <form onSubmit={event => { event.preventDefault(); save.mutate() }} className="space-y-4">
      <label className="flex items-center gap-2"><input type="checkbox" checked={settings.enabled} disabled={busy} onChange={event => setSettings({ ...settings, enabled: event.target.checked })} />{dict["admin.storage.enabled"]}</label>
      {(["endpoint", "region", "bucket", "prefix", "publicBaseUrl"] as const).map(key => <div key={key} className="grid gap-2 md:grid-cols-[220px_1fr]">
        <label htmlFor={`storage-${key}`} className="font-semibold">{dict[`admin.storage.${key}`]}</label>
        <input id={`storage-${key}`} type="text" dir="ltr" value={settings[key]} disabled={busy} maxLength={key === "endpoint" || key === "publicBaseUrl" ? 2048 : 200} onChange={event => setSettings({ ...settings, [key]: event.target.value })} className="h-[32px] w-full max-w-xl rounded-[3px] border border-[#8c8f94] bg-white px-2.5" />
      </div>)}
      <div className="grid gap-2 md:grid-cols-[220px_1fr]"><label htmlFor="storage-access-key" className="font-semibold">{dict["admin.storage.access_key"]}</label><input id="storage-access-key" type="password" dir="ltr" autoComplete="new-password" value={accessKeyId} disabled={busy} maxLength={200} onChange={event => setAccessKeyId(event.target.value)} className="h-[32px] w-full max-w-xl rounded-[3px] border border-[#8c8f94] bg-white px-2.5" /></div>
      <div className="grid gap-2 md:grid-cols-[220px_1fr]"><label htmlFor="storage-secret-key" className="font-semibold">{dict["admin.storage.secret_key"]}</label><input id="storage-secret-key" type="password" dir="ltr" autoComplete="new-password" value={secretAccessKey} disabled={busy} maxLength={500} onChange={event => setSecretAccessKey(event.target.value)} className="h-[32px] w-full max-w-xl rounded-[3px] border border-[#8c8f94] bg-white px-2.5" /></div>
      <p className="text-xs text-[#646970]">{dict[credentialsConfigured ? "admin.storage.credentials_saved" : "admin.storage.credentials_help"]}</p>
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} className="h-[30px] rounded-[3px] bg-[#2271b1] px-3 text-white disabled:opacity-50">{dict[save.isPending ? "admin.common.saving" : "admin.settings.save_changes"]}</button>
        <button type="button" disabled={busy || !credentialsConfigured} onClick={() => test.mutate()} className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[#2271b1] disabled:opacity-50">{dict[test.isPending ? "admin.storage.testing" : "admin.storage.test"]}</button>
        <button type="button" disabled={busy || !credentialsConfigured} onClick={() => cleanup.mutate()} className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[#2271b1] disabled:opacity-50">{dict["admin.storage.cleanup"]}</button>
      </div>
    </form>
    <p className="text-xs text-[#646970]">{dict["admin.storage.delivery_help"]}</p>
    {message && <p role="status" className="border-s-4 border-[#2271b1] bg-[#f0f6fc] p-3">{message}</p>}
  </section>
}
