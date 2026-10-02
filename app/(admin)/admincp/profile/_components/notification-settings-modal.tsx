"use client";

import React, { useState } from "react";
import { Bell, Check, Loader2, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  notificationTx?: boolean;
  notificationSecurity?: boolean;
  notificationPromo?: boolean;
};

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: Partial<User>) => void;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
  user,
  onUpdate,
  dict = {},
  direction,
}: NotificationSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    notificationTx: user.notificationTx ?? true,
    notificationSecurity: user.notificationSecurity ?? true,
    notificationPromo: user.notificationPromo ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg(null);

    try {
      onUpdate({ ...user, ...settings });
      setSuccessMsg(dict["admin.profile.save_changes"] ? `${dict["admin.profile.save_changes"]} ✓` : "Preferences saved successfully.");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir={direction} className="sm:max-w-md rounded-[4px] border border-[#c3c4c7] bg-white shadow-lg p-5 text-start">
        <DialogHeader className="border-b border-[#c3c4c7] pb-3 pe-8 text-start">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-[#2271b1]" />
            <DialogTitle className="text-[15px] font-semibold text-[#1d2327]">
              {dict["admin.profile.notifications"] || "Email Notification Preferences"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-[12px] text-[#646970] mt-1">
            {dict["admin.profile.security_alerts_desc"] || "Select notifications you want to receive on your admin account."}
          </DialogDescription>
        </DialogHeader>

        {successMsg && (
          <div className="border-s-4 border-[#00a32a] bg-[#edfaef] text-[#007017] p-2.5 text-[12px] font-medium rounded-[2px] flex items-center gap-1.5">
            <Check className="size-3.5 text-[#007017]" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          {/* Security alerts */}
          <div className="flex items-start justify-between gap-3 rounded-[3px] border border-[#c3c4c7] p-3.5 bg-[#f6f7f7]">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-white text-[#2271b1]">
                <ShieldCheck className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="notif-sec" className="text-[13px] font-semibold text-[#1d2327] cursor-pointer">
                  {dict["admin.profile.security_alerts"] || "Security & Sign-in Alerts"}
                </Label>
                <p className="text-[11px] text-[#646970] leading-relaxed">
                  {dict["admin.profile.security_alerts_desc"] || "Alerts when logging in from an unrecognized device or changing credentials."}
                </p>
              </div>
            </div>
            <input
              id="notif-sec"
              type="checkbox"
              checked={settings.notificationSecurity}
              onChange={(e) => setSettings({ ...settings, notificationSecurity: e.target.checked })}
              className="mt-1 size-4 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
            />
          </div>

          {/* System & Editorial notifications */}
          <div className="flex items-start justify-between gap-3 rounded-[3px] border border-[#c3c4c7] p-3.5 bg-[#f6f7f7]">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-white text-[#2271b1]">
                <Zap className="size-3.5" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="notif-tx" className="text-[13px] font-semibold text-[#1d2327] cursor-pointer">
                  {dict["admin.profile.content_alerts"] || "Content & Editorial Notifications"}
                </Label>
                <p className="text-[11px] text-[#646970] leading-relaxed">
                  {dict["admin.profile.content_alerts_desc"] || "Notifications when comments require moderation or articles are published."}
                </p>
              </div>
            </div>
            <input
              id="notif-tx"
              type="checkbox"
              checked={settings.notificationTx}
              onChange={(e) => setSettings({ ...settings, notificationTx: e.target.checked })}
              className="mt-1 size-4 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
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
              disabled={isLoading}
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
