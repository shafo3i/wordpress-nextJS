"use client";

import React, { useState } from "react";
import { AlertCircle, Check, Fingerprint, Loader2, Plus, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PasskeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export default function PasskeySettings({
  isOpen,
  onClose,
  dict = {},
  direction,
}: PasskeySettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const registerPasskey = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      type PasskeyClient = {
        passkey?: {
          addPasskey?: () => Promise<{ error?: { message?: string } }>;
        };
      };

      const client = authClient as unknown as PasskeyClient;
      if (!client.passkey?.addPasskey) {
        setErrorMsg("Passkey WebAuthn plugin is not enabled on the authentication server.");
        return;
      }

      const res = await client.passkey.addPasskey();
      if (res?.error) {
        setErrorMsg(res.error.message || "Failed to register passkey.");
        return;
      }

      setSuccessMsg("Passkey registered successfully! You can now sign in using biometrics.");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1800);
    } catch {
      setErrorMsg("Your browser or device might not support WebAuthn / Passkeys.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir={direction} className="sm:max-w-md rounded-[4px] border border-[#c3c4c7] bg-white shadow-lg p-5 text-start">
        <DialogHeader className="border-b border-[#c3c4c7] pb-3 pe-8 text-start">
          <div className="flex items-center gap-2">
            <Fingerprint className="size-4 text-[#2271b1]" />
            <DialogTitle className="text-[15px] font-semibold text-[#1d2327]">
              {dict["admin.profile.passkeys"] || "Passkeys & Biometrics (WebAuthn)"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-[12px] text-[#646970] mt-1">
            {dict["admin.profile.passkeys_desc"] || "Passwordless authentication using Touch ID, Face ID, Windows Hello, or security keys."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="border-s-4 border-[#d63638] bg-[#fcf0f1] text-[#b32d2e] p-2.5 text-[12px] font-medium rounded-[2px] flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-[#d63638]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="border-s-4 border-[#00a32a] bg-[#edfaef] text-[#007017] p-2.5 text-[12px] font-medium rounded-[2px] flex items-center gap-2">
            <Check className="size-4 shrink-0 text-[#007017]" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-3 py-2 text-[13px]">
          <div className="rounded-[3px] border border-[#c3c4c7] p-3.5 bg-[#f6f7f7] space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#1d2327]">
              <ShieldCheck className="size-4 text-[#2271b1]" />{" "}
              {dict["admin.profile.passkeys"] || "Passkeys"}
            </div>
            <p className="text-[#646970] text-[12px]">
              {dict["admin.profile.passkeys_recommendation"] ||
                "Passkeys are cryptographic credentials stored on your device that cannot be phished or leaked."}
            </p>
          </div>

          <Button
            onClick={registerPasskey}
            disabled={isLoading}
            className="w-full h-9 text-[13px] font-semibold bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] shadow-xs transition-colors cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-1.5 size-3.5 animate-spin" />
                {dict["admin.profile.saving"] || "Waiting for device..."}
              </>
            ) : (
              <>
                <Plus className="ml-1.5 size-3.5" />
                {dict["admin.profile.setup_passkey"] || "Set up Passkey"}
              </>
            )}
          </Button>
        </div>

        <DialogFooter className="pt-3 border-t border-[#dcdcde] flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-3.5 text-[13px] font-semibold bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] hover:text-[#135e96] border border-[#c3c4c7] rounded-[3px] cursor-pointer"
            onClick={onClose}
          >
            {dict["admin.profile.cancel"] || dict["common.cancel"] || "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
