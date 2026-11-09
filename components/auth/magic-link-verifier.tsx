"use client"

import { useRef, useState } from "react"
import { authClient } from "@/lib/auth-client"
import {
  authFlowUrl,
  requiresTwoFactor,
  safeAuthRedirect,
} from "@/lib/auth-navigation"
import { Button } from "@/components/ui/button"

/** An explicit click prevents mail scanners/prefetch from consuming a one-use link. */
export function MagicLinkVerifier({
  token,
  dict,
  locale,
  callbackUrl,
  login,
}: {
  token: string
  locale?: string
  dict: Record<string, string>
  callbackUrl: string
  login: string
}) {
  const submitted = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function verify() {
    if (submitted.current) return
    submitted.current = true
    setBusy(true)
    setError("")
    try {
      const result = await authClient.magicLink.verify({ query: { token } })
      if (result.error) setError(dict["auth.invalidToken.description"])
      else
        window.location.assign(
          requiresTwoFactor(result.data)
            ? authFlowUrl("/verify-2fa", callbackUrl, login, locale)
            : safeAuthRedirect(callbackUrl)
        )
    } catch {
      setError(dict["auth.requestError"])
    } finally {
      setBusy(false)
      submitted.current = false
    }
  }
  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Button className="w-full" disabled={busy} onClick={verify}>
        {dict[busy ? "auth.working" : "auth.magic.continue"]}
      </Button>
    </div>
  )
}
