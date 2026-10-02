"use client";

import React, { useState } from "react";
import { Check, Edit, Loader2, User as UserIcon } from "lucide-react";
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

type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  twoFactorEnabled?: boolean | null;
  createdAt: string | Date;
  phoneNumber?: string | null;
  biometricEnabled?: boolean | null;
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: Partial<User>) => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onUpdate,
  dict = {},
  direction,
}: EditProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const hasChanges =
    name !== user.name || phoneNumber !== (user.phoneNumber || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await authClient.updateUser({
        name: name.trim(),
      });

      if (res.error) {
        setErrorMsg(res.error.message || "Failed to update profile.");
        return;
      }

      onUpdate({ name: name.trim(), phoneNumber: phoneNumber.trim() || null });
      setSuccessMsg(dict["admin.profile.save_changes"] ? `${dict["admin.profile.save_changes"]} ✓` : "Profile updated successfully.");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName(user.name || "");
      setPhoneNumber(user.phoneNumber || "");
      setErrorMsg(null);
      setSuccessMsg(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        dir={direction}
        className="sm:max-w-[440px] rounded-[4px] border border-[#c3c4c7] bg-white p-5 shadow-lg text-start"
      >
        <DialogHeader className="border-b border-[#c3c4c7] pb-3 pe-8 text-start">
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-[#2271b1]" />
            <DialogTitle className="text-[15px] font-semibold text-[#1d2327]">
              {dict["admin.profile.edit_profile"] || "Edit Profile"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-[12px] text-[#646970] mt-1">
            {dict["admin.profile.edit_profile_desc"] || "Update your display name and contact phone number."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="border-s-4 border-[#d63638] bg-[#fcf0f1] text-[#b32d2e] p-2.5 text-[12px] font-medium rounded-[2px]">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="border-s-4 border-[#00a32a] bg-[#edfaef] text-[#007017] p-2.5 text-[12px] font-medium rounded-[2px] flex items-center gap-1.5">
            <Check className="size-3.5 text-[#007017]" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-[13px] font-semibold text-[#1d2327]">
              {dict["admin.profile.display_name"] || "Display Name"}
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dict["admin.profile.display_name"] || "Name"}
              required
              className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-[13px] text-[#2c3338] shadow-xs focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden text-start placeholder:text-start"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email" className="text-[13px] font-semibold text-[#1d2327]">
              {dict["admin.profile.email"] || "Email"}
            </Label>
            <Input
              id="edit-email"
              value={user.email}
              disabled
              className="h-8.5 rounded-[4px] border border-[#dcdcde] bg-[#f0f0f1] px-3 py-1.5 text-[13px] font-mono text-[#50575e] cursor-not-allowed text-start"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-phone" className="text-[13px] font-semibold text-[#1d2327]">
              {dict["admin.profile.phone"] || "Phone Number"}
            </Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={dict["admin.profile.phone"] || "+1 555 123 4567"}
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
              disabled={isLoading || !hasChanges}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-1.5 size-3.5 animate-spin" />
                  {dict["admin.profile.saving"] || "Saving..."}
                </>
              ) : (
                dict["admin.profile.save_changes"] || dict["common.save"] || "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
