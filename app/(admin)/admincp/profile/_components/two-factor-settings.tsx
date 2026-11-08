"use client"

import React, { useState } from "react"
import {
  Loader2,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Shield,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TwoFactorSettingsProps {
  isOpen: boolean
  onClose: () => void
  user: { twoFactorEnabled?: boolean | null }
  onUpdate?: () => void
  dict?: Record<string, string>
  direction?: "rtl" | "ltr"
}

export default function TwoFactorSettings({
  isOpen,
  onClose,
  user,
  onUpdate,
  dict = {},
  direction,
}: TwoFactorSettingsProps) {
  const isEnabled = !!user.twoFactorEnabled

  const [step, setStep] = useState<
    "initial" | "setup" | "backup_codes" | "disable"
  >("initial")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [totpUri, setTotpUri] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const resetState = () => {
    setStep("initial")
    setPassword("")
    setCode("")
    setTotpUri("")
    setBackupCodes([])
    setErrorMsg(null)
    setSuccessMsg(null)
    setCopiedSecret(false)
    setCopiedCodes(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState()
      onClose()
    }
  }

  // Extract secret key from otpauth:// URI
  const extractSecretKey = (uri: string): string => {
    try {
      const parsed = new URL(uri)
      return parsed.searchParams.get("secret") || uri
    } catch {
      return uri
    }
  }

  // Start 2FA Setup
  const handleStartSetup = async () => {
    if (!password) {
      setErrorMsg(dict["auth.passwordRequired"])
      return
    }
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const res = await authClient.twoFactor.enable({ password })
      if (res.error) {
        setErrorMsg(dict["auth.twoFactorSetupError"])
        return
      }

      if (res.data && "totpURI" in res.data) {
        setTotpUri(res.data.totpURI as string)
        setBackupCodes((res.data.backupCodes as string[]) || [])
      }
      setStep("setup")
    } catch {
      const msg = dict["auth.twoFactorSetupError"]
      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Verify TOTP Code
  const handleVerifyTotp = async () => {
    if (code.trim().length !== 6) {
      setErrorMsg(dict["auth.authenticatorCode"])
      return
    }
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
        trustDevice: false,
      })

      if (res.error) {
        setErrorMsg(dict["auth.twoFactorSetupError"])
        return
      }

      setSuccessMsg(dict["auth.twoFactorEnabled"])
      setStep("backup_codes")
      onUpdate?.()
    } catch {
      const msg = dict["auth.twoFactorSetupError"]
      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!password) {
      setErrorMsg(dict["auth.passwordRequired"])
      return
    }
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const res = await authClient.twoFactor.disable({ password })
      if (res.error) {
        setErrorMsg(dict["auth.twoFactorSetupError"])
        return
      }

      setSuccessMsg(dict["auth.twoFactorDisabled"])
      onUpdate?.()
      setTimeout(() => {
        resetState()
        onClose()
      }, 1400)
    } catch {
      const msg = dict["auth.twoFactorSetupError"]
      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopySecret = async () => {
    setErrorMsg(null)
    try {
      await navigator.clipboard.writeText(extractSecretKey(totpUri))
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    } catch {
      setErrorMsg(dict["auth.copyError"])
    }
  }

  const handleCopyBackupCodes = async () => {
    setErrorMsg(null)
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"))
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    } catch {
      setErrorMsg(dict["auth.copyError"])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        dir={direction}
        className="rounded-[4px] border border-[#c3c4c7] bg-white p-5 text-start text-[#1d2327] shadow-lg sm:max-w-[480px]"
      >
        <DialogHeader className="border-b border-[#c3c4c7] pe-8 pb-3 text-start">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-[#2271b1]" />
              <DialogTitle className="text-[15px] font-semibold text-[#1d2327]">
                {dict["admin.profile.two_factor"]}
              </DialogTitle>
            </div>
            {isEnabled ? (
              <span className="rounded-[2px] border border-[#a7e3b2] bg-[#edfaef] px-2 py-0.5 text-[11px] font-bold text-[#007017]">
                {dict["admin.profile.two_factor_active"]} ✓
              </span>
            ) : (
              <span className="rounded-[2px] border border-[#c3c4c7] bg-[#f6f7f7] px-2 py-0.5 text-[11px] font-medium text-[#50575e]">
                {dict["admin.profile.two_factor_disabled"]}
              </span>
            )}
          </div>
          <DialogDescription className="mt-1 text-[12px] text-[#646970]">
            {dict["admin.profile.two_factor_desc"]}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="flex items-center gap-1.5 rounded-[2px] border-s-4 border-[#d63638] bg-[#fcf0f1] p-2.5 text-[12px] font-medium text-[#b32d2e]">
            <AlertCircle className="size-3.5 shrink-0 text-[#d63638]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 rounded-[2px] border-s-4 border-[#00a32a] bg-[#edfaef] p-2.5 text-[12px] font-medium text-[#007017]">
            <Check className="size-3.5 shrink-0 text-[#007017]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: INITIAL */}
        {step === "initial" && (
          <div className="space-y-4 py-2">
            {isEnabled ? (
              <div className="space-y-3">
                <div className="space-y-1 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] p-3.5 text-[12px] text-[#2c3338]">
                  <div className="flex items-center gap-1.5 font-bold text-[#1d2327]">
                    <ShieldCheck className="size-4 text-[#007017]" />{" "}
                    {dict["admin.profile.two_factor_active"]}
                  </div>
                  <p className="leading-relaxed text-[#646970]">
                    {dict["admin.profile.two_factor_desc"]}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full cursor-pointer rounded-[3px] border border-[#d63638] text-[13px] font-semibold text-[#b32d2e] shadow-none hover:bg-[#fcf0f1] hover:text-[#d63638]"
                  onClick={() => setStep("disable")}
                >
                  {dict["admin.profile.disable_two_factor"]}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] leading-relaxed text-[#50575e]">
                  {dict["admin.profile.two_factor_desc"]}
                </p>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="twofa-pw"
                    className="text-[13px] font-semibold text-[#1d2327]"
                  >
                    {dict["admin.profile.current_password"]}
                  </Label>
                  <Input
                    id="twofa-pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white text-start text-[13px] placeholder:text-start focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                  />
                </div>

                <Button
                  size="sm"
                  className="h-9 w-full cursor-pointer rounded-[3px] border border-[#2271b1] bg-[#2271b1] text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#135e96]"
                  onClick={handleStartSetup}
                  disabled={isLoading || !password}
                >
                  {isLoading ? (
                    <Loader2 className="ml-1.5 size-3.5 animate-spin" />
                  ) : null}
                  {dict["admin.profile.enable_two_factor"]} →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SETUP (ENTER KEY & VERIFY CODE) */}
        {step === "setup" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2.5 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] p-3.5 text-center">
              <p className="text-[13px] font-semibold text-[#1d2327]">
                {dict["auth.manualSetup"]}
              </p>

              <div className="pt-1 text-start">
                <span className="mb-1 block text-[12px] text-[#646970]">
                  {dict["auth.secretKey"]}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={extractSecretKey(totpUri)}
                    className="flex-1 rounded-[3px] border border-[#8c8f94] bg-white px-2.5 py-1 text-center font-mono text-[12px] text-[#2c3338] select-all focus:outline-none"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="flex cursor-pointer items-center gap-1 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-2.5 py-1 text-[12px] font-semibold text-[#2271b1] transition-colors hover:bg-[#f0f0f1]"
                  >
                    {copiedSecret ? (
                      <Check className="size-3 text-[#007017]" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {dict[copiedSecret ? "auth.copied" : "auth.copy"]}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="verify-code"
                className="text-[13px] font-semibold text-[#1d2327]"
              >
                {dict["admin.profile.totp_code"]}
              </Label>
              <Input
                id="verify-code"
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="h-10 rounded-[4px] border border-[#8c8f94] bg-white text-center font-mono text-xl font-bold tracking-[0.25em] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                dir="ltr"
                autoFocus
              />
            </div>

            <Button
              size="sm"
              className="h-9 w-full cursor-pointer rounded-[3px] border border-[#2271b1] bg-[#2271b1] text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#135e96]"
              onClick={handleVerifyTotp}
              disabled={isLoading || code.trim().length !== 6}
            >
              {isLoading ? (
                <Loader2 className="ml-1.5 size-3.5 animate-spin" />
              ) : null}
              {dict["admin.profile.save_changes"]}
            </Button>
          </div>
        )}

        {/* STEP 3: BACKUP CODES */}
        {step === "backup_codes" && (
          <div className="space-y-3.5 py-2">
            <div className="space-y-1 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] p-3.5 text-[12px] leading-relaxed text-[#2c3338]">
              <div className="flex items-center gap-1.5 font-bold text-[#1d2327]">
                <KeyRound className="size-3.5 text-[#2271b1]" />{" "}
                {dict["admin.profile.backup_codes"]}
              </div>
              <p className="text-[#646970]">
                {dict["admin.profile.backup_codes_desc"]}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] p-3">
              {backupCodes.map((c, i) => (
                <div
                  key={i}
                  className="rounded-[2px] border border-[#c3c4c7] bg-white px-2 py-1 text-center font-mono text-[12px] font-bold tracking-wider text-[#1d2327] select-all"
                  dir="ltr"
                >
                  {c}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className="flex h-8.5 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[12px] font-semibold text-[#2271b1] transition-colors hover:bg-[#f0f0f1]"
              >
                {copiedCodes ? (
                  <Check className="size-3.5 text-[#007017]" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copiedCodes
                  ? dict["auth.copied"]
                  : dict["admin.profile.copy_codes"]}
              </button>
              <Button
                size="sm"
                className="h-8.5 flex-1 cursor-pointer rounded-[3px] border border-[#2271b1] bg-[#2271b1] text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#135e96]"
                onClick={() => {
                  resetState()
                  onClose()
                }}
              >
                {dict["admin.profile.cancel"]}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: DISABLE */}
        {step === "disable" && (
          <div className="space-y-3 py-2">
            <div className="space-y-1 rounded-[3px] border border-[#d63638] bg-[#fcf0f1] p-3.5 text-[12px] text-[#d63638]">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="size-3.5 text-[#d63638]" />{" "}
                {dict["admin.profile.disable_two_factor"]}
              </div>
              <p className="leading-relaxed">
                {dict["admin.profile.two_factor_desc"]}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="disable-pw"
                className="text-[13px] font-semibold text-[#1d2327]"
              >
                {dict["admin.profile.current_password"]}
              </Label>
              <Input
                id="disable-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white text-start text-[13px] placeholder:text-start focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8.5 flex-1 cursor-pointer rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[13px] font-semibold text-[#2271b1] hover:bg-[#f0f0f1]"
                onClick={() => setStep("initial")}
                disabled={isLoading}
              >
                {dict["admin.profile.cancel"]}
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8.5 flex-1 cursor-pointer rounded-[3px] border border-[#b32d2e] bg-[#b32d2e] text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#8a2424]"
                onClick={handleDisable2FA}
                disabled={isLoading || !password}
              >
                {isLoading ? (
                  <Loader2 className="ml-1.5 size-3.5 animate-spin" />
                ) : null}
                {dict["admin.profile.disable_two_factor"]}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
