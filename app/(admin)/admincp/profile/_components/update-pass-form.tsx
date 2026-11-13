"use client";

import React, { useState } from "react";
import { Check, AlertCircle, Loader2, Lock } from "lucide-react";
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

interface UpdatePassFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export default function UpdatePassForm({
  isOpen,
  onClose,
  onSuccess,
  dict = {},
  direction,
}: UpdatePassFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg(dict["auth.passwordRequired"]);
      return;
    }
    if (newPassword.length < 12 || newPassword.length > 128) {
      setErrorMsg(dict["admin.profile.password_min_length"]);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(dict["admin.profile.password_mismatch"]);
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (res.error) {
        setErrorMsg(dict["admin.profile.password_error"]);
        return;
      }

      setSuccessMsg(dict["admin.profile.password_saved"]);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch {
      setErrorMsg(dict["admin.profile.password_error"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMsg(null);
      setSuccessMsg(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        dir={direction}
        className="rounded-[4px] border border-[#c3c4c7] bg-white p-5 text-start shadow-lg sm:max-w-[440px]"
      >
        <DialogHeader className="border-b border-[#c3c4c7] pe-8 pb-3 text-start">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-[#2271b1]" />
            <DialogTitle className="text-[15px] font-semibold text-[#1d2327]">
              {dict["admin.profile.change_password"]}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-1 text-[12px] text-[#646970]">
            {dict["admin.profile.change_password_desc"]}
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

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="curr-pass"
              className="text-[13px] font-semibold text-[#1d2327]"
            >
              {dict["admin.profile.current_password"]}
            </Label>
            <Input
              id="curr-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={dict["auth.password"]}
              required
              className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-start text-[13px] text-[#2c3338] shadow-xs placeholder:text-start focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
              maxLength={128}
              autoComplete="current-password"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="new-pass"
              className="text-[13px] font-semibold text-[#1d2327]"
            >
              {dict["admin.profile.new_password"]} (
              {dict["admin.profile.password_min_length"]})
            </Label>
            <Input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={dict["auth.password"]}
              required
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-start text-[13px] text-[#2c3338] shadow-xs placeholder:text-start focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confirm-pass"
              className="text-[13px] font-semibold text-[#1d2327]"
            >
              {dict["admin.profile.confirm_password"]}
            </Label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={dict["auth.password"]}
              required
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-start text-[13px] text-[#2c3338] shadow-xs placeholder:text-start focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 border-t border-[#dcdcde] pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 cursor-pointer rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-3.5 text-[13px] font-semibold text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96]"
              onClick={() => onClose()}
              disabled={isLoading}
            >
              {dict["admin.profile.cancel"] || dict["common.cancel"]}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 cursor-pointer rounded-[3px] border border-[#2271b1] bg-[#2271b1] px-4 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#135e96]"
              disabled={
                isLoading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-1.5 size-3.5 animate-spin" />
                  {dict["admin.profile.saving"]}
                </>
              ) : (
                dict["admin.profile.change_password"]
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
