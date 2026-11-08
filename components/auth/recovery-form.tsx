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

export function RecoveryForm({
  mode,
  token,
  dict,
  callbackUrl,
  login,
}: {
  mode: "forgot" | "reset" | "magic" | "emailOtp" | "verifyEmail"
  token?: string
  dict: Record<string, string>
  callbackUrl: string
  login: string
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError("")
    if (mode === "reset" && password !== confirm) {
      setError(dict["auth.passwordMismatch"])
      return
    }
    setBusy(true)
    try {
      if (mode === "emailOtp") {
        const result = otpSent
          ? await authClient.signIn.emailOtp({ email: email.trim(), otp })
          : await authClient.emailOtp.sendVerificationOtp({
              email: email.trim(),
              type: "sign-in",
            })
        if (result.error) setError(dict["auth.requestError"])
        else if (!otpSent) setOtpSent(true)
        else
          window.location.assign(
            requiresTwoFactor(result.data)
              ? authFlowUrl("/verify-2fa", callbackUrl, login)
              : safeAuthRedirect(callbackUrl)
          )
        return
      }
      const verifiedUrl = authFlowUrl("/email-verified", callbackUrl, login)
      const result =
        mode === "forgot"
          ? await authClient.requestPasswordReset({
              email: email.trim(),
              redirectTo: authFlowUrl("/password-reset", callbackUrl, login),
            })
          : mode === "reset"
            ? await authClient.resetPassword({
                token: token || "",
                newPassword: password,
              })
            : mode === "magic"
              ? await authClient.signIn.magicLink({
                  email: email.trim(),
                  callbackURL: callbackUrl,
                })
              : await authClient.sendVerificationEmail({
                  email: email.trim(),
                  callbackURL: verifiedUrl,
                })
      if (result.error)
        setError(
          dict[mode === "reset" ? "auth.resetError" : "auth.requestError"]
        )
      else {
        setSuccess(true)
        setPassword("")
        setConfirm("")
      }
    } catch {
      setError(dict["auth.requestError"])
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {success && (
        <p
          role="status"
          className="border-s-4 border-green-600 bg-green-50 p-3 text-sm"
        >
          {dict[mode === "reset" ? "auth.resetSuccess" : "auth.emailSent"]}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="border-s-4 border-red-600 bg-red-50 p-3 text-sm"
        >
          {error}
        </p>
      )}
      {mode === "reset" ? (
        <>
          <div className="space-y-1">
            <Label htmlFor="new-password">{dict["auth.newPassword"]}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm-password">
              {dict["auth.confirmPassword"]}
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="space-y-1">
          <Label htmlFor="recovery-email">{dict["auth.email"]}</Label>
          <Input
            id="recovery-email"
            dir="ltr"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            readOnly={otpSent}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      )}
      {otpSent && (
        <>
          <p role="status" className="text-sm">
            {dict["auth.emailSent"]}
          </p>
          <div className="space-y-1">
            <Label htmlFor="email-code">{dict["auth.emailOtp.code"]}</Label>
            <Input
              id="email-code"
              dir="ltr"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </div>
        </>
      )}
      <Button type="submit" className="w-full" disabled={busy || success}>
        {
          dict[
            busy
              ? "auth.working"
              : otpSent
                ? "auth.emailOtp.verify"
                : `auth.${mode}.submit`
          ]
        }
      </Button>
      {otpSent && (
        <button
          type="button"
          className="text-sm text-[#2271b1] underline"
          disabled={busy}
          onClick={() => {
            setOtpSent(false)
            setOtp("")
            setError("")
          }}
        >
          {dict["auth.emailOtp.change"]}
        </button>
      )}
    </form>
  )
}
