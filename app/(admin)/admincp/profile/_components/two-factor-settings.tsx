"use client";

import React, { useState } from "react";
import { Loader2, KeyRound, Copy, Check, ShieldCheck, AlertCircle, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TwoFactorSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: { twoFactorEnabled?: boolean | null };
  onUpdate?: () => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export default function TwoFactorSettings({
  isOpen,
  onClose,
  user,
  onUpdate,
  dict = {},
  direction,
}: TwoFactorSettingsProps) {
  const isEnabled = !!user.twoFactorEnabled;

  const [step, setStep] = useState<"initial" | "setup" | "backup_codes" | "disable">("initial");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetState = () => {
    setStep("initial");
    setPassword("");
    setCode("");
    setTotpUri("");
    setBackupCodes([]);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCopiedSecret(false);
    setCopiedCodes(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
      onClose();
    }
  };

  // Extract secret key from otpauth:// URI
  const extractSecretKey = (uri: string): string => {
    try {
      const parsed = new URL(uri);
      return parsed.searchParams.get("secret") || uri;
    } catch {
      return uri;
    }
  };

  // Start 2FA Setup
  const handleStartSetup = async () => {
    if (!password) {
      setErrorMsg("Password is required to initialize two-factor authentication.");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await authClient.twoFactor.enable({ password });
      if (res.error) {
        setErrorMsg(res.error.message || "Failed to initialize 2FA.");
        return;
      }

      if (res.data && "totpURI" in res.data) {
        setTotpUri(res.data.totpURI as string);
        setBackupCodes((res.data.backupCodes as string[]) || []);
      }
      setStep("setup");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initialize 2FA.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify TOTP Code
  const handleVerifyTotp = async () => {
    if (code.trim().length !== 6) {
      setErrorMsg("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
        trustDevice: true,
      });

      if (res.error) {
        setErrorMsg(res.error.message || "Invalid verification code. Please check your app.");
        return;
      }

      setSuccessMsg("Two-factor authentication enabled successfully!");
      setStep("backup_codes");
      onUpdate?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!password) {
      setErrorMsg("Password is required to disable two-factor authentication.");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await authClient.twoFactor.disable({ password });
      if (res.error) {
        setErrorMsg(res.error.message || "Failed to disable 2FA. Please check your password.");
        return;
      }

      setSuccessMsg("Two-factor authentication disabled successfully.");
      onUpdate?.();
      setTimeout(() => {
        resetState();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disable 2FA.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    const secret = extractSecretKey(totpUri);
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent dir={direction} className="sm:max-w-[480px] rounded-[4px] border border-[#c3c4c7] p-5 bg-white text-[#1d2327] shadow-lg text-start">
        <DialogHeader className="border-b border-[#c3c4c7] pb-3 pe-8 text-start">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-[#2271b1]" />
              <DialogTitle className="text-[15px] font-semibold text-[#1d2327]">
                {dict["admin.profile.two_factor"] || "Two-Factor Authentication (2FA)"}
              </DialogTitle>
            </div>
            {isEnabled ? (
              <span className="bg-[#edfaef] text-[#007017] border border-[#a7e3b2] text-[11px] font-bold px-2 py-0.5 rounded-[2px]">
                {dict["admin.profile.two_factor_active"] || "Active"} ✓
              </span>
            ) : (
              <span className="border-[#c3c4c7] bg-[#f6f7f7] text-[#50575e] text-[11px] font-medium px-2 py-0.5 rounded-[2px] border">
                {dict["admin.profile.two_factor_disabled"] || "Disabled"}
              </span>
            )}
          </div>
          <DialogDescription className="text-[12px] text-[#646970] mt-1">
            {dict["admin.profile.two_factor_desc"] || "Protect your account with a time-based code (TOTP) from an authenticator app."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="border-s-4 border-[#d63638] bg-[#fcf0f1] text-[#b32d2e] p-2.5 text-[12px] font-medium rounded-[2px] flex items-center gap-1.5">
            <AlertCircle className="size-3.5 text-[#d63638] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="border-s-4 border-[#00a32a] bg-[#edfaef] text-[#007017] p-2.5 text-[12px] font-medium rounded-[2px] flex items-center gap-1.5">
            <Check className="size-3.5 text-[#007017] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: INITIAL */}
        {step === "initial" && (
          <div className="space-y-4 py-2">
            {isEnabled ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[12px] text-[#2c3338] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#1d2327]">
                    <ShieldCheck className="size-4 text-[#007017]" /> {dict["admin.profile.two_factor_active"] || "Active & Protected"}
                  </div>
                  <p className="text-[#646970] leading-relaxed">
                    {dict["admin.profile.two_factor_desc"] || "Two-factor authentication is active on your account."}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-[13px] font-semibold text-[#b32d2e] hover:bg-[#fcf0f1] hover:text-[#d63638] border border-[#d63638] rounded-[3px] h-9 cursor-pointer shadow-none"
                  onClick={() => setStep("disable")}
                >
                  {dict["admin.profile.disable_two_factor"] || "Disable 2FA"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-[#50575e] leading-relaxed">
                  {dict["admin.profile.two_factor_desc"] || "Enter your current password to begin setting up an authenticator app."}
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="twofa-pw" className="text-[13px] font-semibold text-[#1d2327]">
                    {dict["admin.profile.current_password"] || "Current Password"}
                  </Label>
                  <Input
                    id="twofa-pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-8.5 text-[13px] bg-white border border-[#8c8f94] focus:border-[#2271b1] rounded-[4px] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden text-start placeholder:text-start"
                  />
                </div>

                <Button
                  size="sm"
                  className="w-full h-9 text-[13px] font-semibold bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] transition-colors shadow-xs cursor-pointer"
                  onClick={handleStartSetup}
                  disabled={isLoading || !password}
                >
                  {isLoading ? <Loader2 className="ml-1.5 size-3.5 animate-spin" /> : null}
                  {dict["admin.profile.enable_two_factor"] || "Continue to QR Code"} →
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SETUP (SCAN QR & ENTER CODE) */}
        {step === "setup" && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-center space-y-2.5">
              <p className="text-[13px] text-[#1d2327] font-semibold">
                {dict["admin.profile.scan_qr_desc"] || "Scan the QR code using your authenticator app:"}
              </p>

              {totpUri && (
                <div className="mx-auto w-36 h-36 bg-white p-2 rounded-[3px] border border-[#c3c4c7] flex items-center justify-center shadow-2xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(totpUri)}`}
                    alt="TOTP QR"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="pt-1 text-start">
                <span className="text-[12px] text-[#646970] block mb-1">
                  {dict["admin.profile.or_enter_secret"] || "Or enter secret key manually:"}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={extractSecretKey(totpUri)}
                    className="flex-1 px-2.5 py-1 text-[12px] font-mono bg-white border border-[#8c8f94] rounded-[3px] text-[#2c3338] text-center select-all focus:outline-none"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="px-2.5 py-1 bg-[#f6f7f7] border border-[#c3c4c7] hover:bg-[#f0f0f1] rounded-[3px] text-[12px] font-semibold text-[#2271b1] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedSecret ? <Check className="size-3 text-[#007017]" /> : <Copy className="size-3" />}
                    {copiedSecret ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="verify-code" className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.totp_code"] || "Verification Code (6 digits)"}
              </Label>
              <Input
                id="verify-code"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="h-10 text-center font-mono text-xl tracking-[0.25em] font-bold bg-white border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] rounded-[4px] focus:outline-hidden"
                dir="ltr"
                autoFocus
              />
            </div>

            <Button
              size="sm"
              className="w-full h-9 text-[13px] font-semibold bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] transition-colors shadow-xs cursor-pointer"
              onClick={handleVerifyTotp}
              disabled={isLoading || code.trim().length !== 6}
            >
              {isLoading ? <Loader2 className="ml-1.5 size-3.5 animate-spin" /> : null}
              {dict["admin.profile.save_changes"] || "Confirm & Activate 2FA"}
            </Button>
          </div>
        )}

        {/* STEP 3: BACKUP CODES */}
        {step === "backup_codes" && (
          <div className="space-y-3.5 py-2">
            <div className="p-3.5 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] text-[12px] text-[#2c3338] space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-[#1d2327]">
                <KeyRound className="size-3.5 text-[#2271b1]" /> {dict["admin.profile.backup_codes"] || "Recovery Backup Codes"}
              </div>
              <p className="text-[#646970]">
                {dict["admin.profile.backup_codes_desc"] || "Save these codes securely in case you lose access to your device."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px]">
              {backupCodes.map((c, i) => (
                <div
                  key={i}
                  className="px-2 py-1 bg-white border border-[#c3c4c7] rounded-[2px] text-center font-mono text-[12px] text-[#1d2327] font-bold select-all tracking-wider"
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
                className="flex-1 h-8.5 bg-[#f6f7f7] border border-[#c3c4c7] hover:bg-[#f0f0f1] text-[#2271b1] rounded-[3px] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCodes ? <Check className="size-3.5 text-[#007017]" /> : <Copy className="size-3.5" />}
                {copiedCodes ? "Copied" : dict["admin.profile.copy_codes"] || "Copy All Codes"}
              </button>
              <Button
                size="sm"
                className="flex-1 h-8.5 text-[13px] font-semibold bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] transition-colors shadow-xs cursor-pointer"
                onClick={() => {
                  resetState();
                  onClose();
                }}
              >
                {dict["admin.profile.cancel"] || "Done & Close"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: DISABLE */}
        {step === "disable" && (
          <div className="space-y-3 py-2">
            <div className="p-3.5 bg-[#fcf0f1] border border-[#d63638] rounded-[3px] text-[12px] text-[#d63638] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="size-3.5 text-[#d63638]" /> {dict["admin.profile.disable_two_factor"] || "Confirm Disabling 2FA"}
              </div>
              <p className="leading-relaxed">
                {dict["admin.profile.two_factor_desc"] || "Are you sure you want to disable two-factor authentication?"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disable-pw" className="text-[13px] font-semibold text-[#1d2327]">
                {dict["admin.profile.current_password"] || "Password Confirmation"}
              </Label>
              <Input
                id="disable-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8.5 text-[13px] bg-white border border-[#8c8f94] focus:border-[#2271b1] rounded-[4px] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden text-start placeholder:text-start"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 h-8.5 text-[13px] font-semibold bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] border border-[#c3c4c7] rounded-[3px] cursor-pointer"
                onClick={() => setStep("initial")}
                disabled={isLoading}
              >
                {dict["admin.profile.cancel"] || dict["common.cancel"] || "Back"}
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 h-8.5 text-[13px] font-semibold bg-[#b32d2e] hover:bg-[#8a2424] text-white border border-[#b32d2e] rounded-[3px] transition-colors cursor-pointer shadow-xs"
                onClick={handleDisable2FA}
                disabled={isLoading || !password}
              >
                {isLoading ? <Loader2 className="ml-1.5 size-3.5 animate-spin" /> : null}
                {dict["admin.profile.disable_two_factor"] || "Confirm Disable"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
