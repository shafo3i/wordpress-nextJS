"use client"

import { useState, type FormEvent } from "react"
import { authClient } from "@/lib/auth-client"
import { safeAuthRedirect } from "@/lib/auth-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TwoFactorForm({
  dict,
  callbackUrl,
}: {
  dict: Record<string, string>
  callbackUrl: string
}) {
  const [code, setCode] = useState("")
  const [backup, setBackup] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const result = backup
        ? await authClient.twoFactor.verifyBackupCode({
            code: code.trim(),
            trustDevice,
          })
        : await authClient.twoFactor.verifyTotp({
            code: code.trim(),
            trustDevice,
          })
      if (result.error) setError(dict["auth.twoFactorError"])
      else window.location.assign(safeAuthRedirect(callbackUrl))
    } catch {
      setError(dict["auth.requestError"])
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p
          role="alert"
          className="border-s-4 border-red-600 bg-red-50 p-3 text-sm"
        >
          {error}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="two-factor-code">
          {dict[backup ? "auth.backupCode" : "auth.authenticatorCode"]}
        </Label>
        <Input
          id="two-factor-code"
          dir="ltr"
          autoComplete="one-time-code"
          inputMode={backup ? "text" : "numeric"}
          pattern={backup ? undefined : "[0-9]{6}"}
          maxLength={backup ? 32 : 6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={trustDevice}
          onChange={(event) => setTrustDevice(event.target.checked)}
        />
        {dict["auth.trustDevice"]}
      </label>
      <Button className="w-full" disabled={busy} type="submit">
        {dict[busy ? "auth.working" : "auth.twoFactor.submit"]}
      </Button>
      <button
        type="button"
        className="text-sm text-[#2271b1] underline"
        disabled={busy}
        onClick={() => {
          setBackup(!backup)
          setCode("")
          setError("")
        }}
      >
        {dict[backup ? "auth.useAuthenticator" : "auth.useBackup"]}
      </button>
    </form>
  )
}
