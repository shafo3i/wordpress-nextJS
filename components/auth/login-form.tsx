"use client"

import { useState, type FormEvent } from "react"
import { authClient } from "@/lib/auth-client"
import {
  authFlowUrl,
  requiresTwoFactor,
  safeAuthRedirect,
} from "@/lib/auth-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  accountType,
  redirectTo,
  dict,
}: {
  accountType: "admin" | "user"
  redirectTo: string
  dict: Record<string, string>
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError("")
    setBusy(true)
    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: safeAuthRedirect(redirectTo),
      })
      if (result.error)
        setError(
          dict[
            result.error.code === "EMAIL_NOT_VERIFIED"
              ? "auth.emailNotVerified"
              : "auth.loginError"
          ]
        )
      else
        window.location.assign(
          requiresTwoFactor(result.data)
            ? authFlowUrl(
                "/verify-2fa",
                redirectTo,
                accountType === "admin" ? "/cms-admin" : "/cms-login"
              )
            : safeAuthRedirect(redirectTo)
        )
    } catch {
      setError(dict["auth.requestError"])
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-1">
        <Label htmlFor="login-email">{dict["auth.email"]}</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="login-password">{dict["auth.password"]}</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error && (
        <p
          role="alert"
          className="border-s-4 border-red-600 bg-red-50 p-3 text-sm"
        >
          {error}
        </p>
      )}
      <Button className="w-full" disabled={busy} type="submit">
        {dict[busy ? "auth.working" : "auth.login.submit"]}
      </Button>
    </form>
  )
}
