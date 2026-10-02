"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Eye, EyeOff, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { resetPasswordAction } from "../action";
import { generateSecurePassword } from "@/lib/password";
import type { UserItem } from "@/services/user.service";

interface ResetPasswordModalProps {
  user: UserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction?: "rtl" | "ltr";
  dict?: Record<string, string>;
  onSuccess: () => void;
}

export function ResetPasswordModal({
  user,
  open,
  onOpenChange,
  direction = "ltr",
  dict = {},
  onSuccess,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    setPassword(generateSecurePassword(14));
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setPassword(generateSecurePassword(14));
      setCompleted(false);
      setError(null);
      setCopied(false);
    }
    onOpenChange(isOpen);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !password) return;
    setError(null);

    startTransition(async () => {
      const res = await resetPasswordAction({
        userId: user.id,
        newPassword: password,
        sendEmailNotification: sendEmail,
      });

      if (!res.success) {
        setError(res.error || "Failed to reset password.");
        return;
      }

      setCompleted(true);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir={direction} className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {dict["admin.users.reset_password_for"] || "Reset Password"}
            {user ? `: ${user.name || user.email}` : ""}
          </DialogTitle>
        </DialogHeader>

        {completed ? (
          <div className="space-y-4 py-2 text-[13px]">
            <div className="rounded border border-[#00a32a] bg-[#f0f6f0] p-3 text-[#00a32a]">
              {dict["admin.users.password_reset_success"] ||
                "Password has been successfully updated!"}
            </div>

            <div className="rounded border border-[#c3c4c7] bg-[#f6f7f7] p-3 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#646970]">
                  {dict["admin.users.new_password"] || "New Password"}:
                </span>
                <span className="font-semibold text-[#1d2327]">{password}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 py-1.5 text-[13px] font-medium text-[#2271b1] hover:bg-[#f0f0f1]"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied
                  ? dict["admin.common.copied"] || "Copied!"
                  : dict["admin.users.copy_password"] || "Copy Password"}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-[3px] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#135e96]"
              >
                {dict["admin.common.done"] || "Done"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-[13px]">
            {error && (
              <div className="rounded border-s-4 border-[#d63638] bg-[#fcf0f1] p-2.5 text-xs text-[#d63638]">
                {error}
              </div>
            )}

            <p className="text-[#646970]">
              {dict["admin.users.reset_password_desc"] ||
                "Generate a strong password for this user. You can customize it or keep the auto-generated one."}
            </p>

            <div className="space-y-1.5">
              <label className="block font-medium text-[#1d2327]">
                {dict["admin.users.new_password"] || "New Password"}
              </label>

              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white pe-9 ps-2.5 font-mono text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-2 top-2 text-[#646970] hover:text-[#1d2327]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  title="Generate new password"
                  className="flex h-[32px] items-center gap-1 rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] px-2.5 text-xs text-[#2c3338] hover:bg-[#f0f0f1]"
                >
                  <RefreshCw className="size-3.5" />
                  {dict["admin.users.regenerate"] || "Regenerate"}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[#50575e] cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="size-4 rounded border-[#8c8f94] text-[#2271b1]"
              />
              {dict["admin.users.send_new_password_email"] ||
                "Send user an email with their new password"}
            </label>

            <DialogFooter className="gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-[30px] rounded-[3px] border border-[#c3c4c7] bg-white px-3 text-[13px] text-[#2c3338] hover:bg-[#f6f7f7]"
              >
                {dict["admin.common.cancel"] || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isPending || !password}
                className="h-[30px] rounded-[3px] bg-[#2271b1] px-4 text-[13px] font-medium text-white hover:bg-[#135e96] disabled:opacity-50"
              >
                {isPending
                  ? dict["admin.common.saving"] || "Saving..."
                  : dict["admin.users.update_password_btn"] || "Update Password"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
