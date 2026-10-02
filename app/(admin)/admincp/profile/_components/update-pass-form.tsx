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
      setErrorMsg("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg(dict["admin.profile.password_min_length"] || "Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
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
        setErrorMsg(res.error.message || "Failed to change password. Please verify your current password.");
        return;
      }

      setSuccessMsg("Password changed successfully and signed out of other sessions.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
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
      <DialogContent dir={direction} className="sm:max-w-[440px] rounded-[4px] border border-[#c3c4c7] bg-white p-5 shadow-lg text-start">
        <DialogHeader className="border-b border-[#c3c4c7] pb-3 pe-8 text-start">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-[#2271b1]" />
            <DialogTitle className="text-[15px] font-semibold text-[#1d2327]">
              {dict["admin.profile.change_password"] || "Change Password"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-[12px] text-[#646970] mt-1">
            {dict["admin.profile.change_password_desc"] || "Update administrator password and sign out of other devices automatically."}
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

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="curr-pass" className="text-[13px] font-semibold text-[#1d2327]">
              {dict["admin.profile.current_password"] || "Current Password"}
            </Label>
            <Input
              id="curr-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#2c3338] shadow-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden text-start placeholder:text-start"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pass" className="text-[13px] font-semibold text-[#1d2327]">
              {dict["admin.profile.new_password"] || "New Password"} ({dict["admin.profile.password_min_length"] || "Min. 8 characters"})
            </Label>
            <Input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#2c3338] shadow-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden text-start placeholder:text-start"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-pass" className="text-[13px] font-semibold text-[#1d2327]">
              {dict["admin.profile.confirm_password"] || "Confirm New Password"}
            </Label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#2c3338] shadow-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden text-start placeholder:text-start"
            />
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-[#dcdcde] flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3.5 text-[13px] font-semibold bg-[#f6f7f7] hover:bg-[#f0f0f1] text-[#2271b1] hover:text-[#135e96] border border-[#c3c4c7] rounded-[3px] cursor-pointer"
              onClick={() => onClose()}
              disabled={isLoading}
            >
              {dict["admin.profile.cancel"] || dict["common.cancel"] || "Cancel"}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 px-4 text-[13px] font-semibold bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] rounded-[3px] shadow-xs transition-colors cursor-pointer"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-1.5 size-3.5 animate-spin" />
                  {dict["admin.profile.saving"] || "Saving..."}
                </>
              ) : (
                dict["admin.profile.change_password"] || "Update Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
