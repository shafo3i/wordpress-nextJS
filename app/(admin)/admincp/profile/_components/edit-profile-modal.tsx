"use client";

import React, { useState } from "react";
import { Check, Loader2, User as UserIcon } from "lucide-react";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const hasChanges = name.trim() !== user.name;

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
        setErrorMsg(dict["admin.profile.update_error"]);
        return;
      }

      onUpdate({ name: name.trim() });
      setSuccessMsg(dict["admin.profile.updated"]);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch {
      setErrorMsg(dict["admin.profile.update_error"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName(user.name || "");
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
            <UserIcon className="size-4 text-[#2271b1]" />
            <DialogTitle className="text-[15px] font-semibold text-[#1d2327]">
              {dict["admin.profile.edit_profile"]}
            </DialogTitle>
          </div>
          <DialogDescription className="mt-1 text-[12px] text-[#646970]">
            {dict["admin.profile.edit_profile_desc"]}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-[2px] border-s-4 border-[#d63638] bg-[#fcf0f1] p-2.5 text-[12px] font-medium text-[#b32d2e]">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-1.5 rounded-[2px] border-s-4 border-[#00a32a] bg-[#edfaef] p-2.5 text-[12px] font-medium text-[#007017]">
            <Check className="size-3.5 text-[#007017]" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="edit-name"
              className="text-[13px] font-semibold text-[#1d2327]"
            >
              {dict["admin.profile.display_name"]}
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dict["admin.profile.display_name"]}
              required
              maxLength={200}
              className="h-8.5 rounded-[4px] border border-[#8c8f94] bg-white px-3 py-1.5 text-start text-[13px] text-[#2c3338] shadow-xs placeholder:text-start focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="edit-email"
              className="text-[13px] font-semibold text-[#1d2327]"
            >
              {dict["admin.profile.email"]}
            </Label>
            <Input
              id="edit-email"
              value={user.email}
              disabled
              className="h-8.5 cursor-not-allowed rounded-[4px] border border-[#dcdcde] bg-[#f0f0f1] px-3 py-1.5 text-start font-mono text-[13px] text-[#50575e]"
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
              disabled={isLoading || !hasChanges}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-1.5 size-3.5 animate-spin" />
                  {dict["admin.profile.saving"]}
                </>
              ) : (
                dict["admin.profile.save_changes"] || dict["common.save"]
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
