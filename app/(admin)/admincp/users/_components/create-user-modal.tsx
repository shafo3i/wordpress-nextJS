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
import { createUserAction } from "../action";
import type { UserRoleOption } from "@/services/user.service";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: UserRoleOption[];
  direction?: "rtl" | "ltr";
  dict?: Record<string, string>;
  onSuccess: () => void;
}

export function CreateUserModal({
  open,
  onOpenChange,
  roles,
  direction = "ltr",
  dict = {},
  onSuccess,
}: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roles[0]?.value || "subscriber");
  const [customPassword, setCustomPassword] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [emailVerified, setEmailVerified] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole(roles[0]?.value || "subscriber");
    setCustomPassword("");
    setAutoGenerate(true);
    setSendEmailNotification(true);
    setEmailVerified(true);
    setCreatedCredentials(null);
    setError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(dict["admin.users.name_required"] || "Name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError(dict["admin.users.email_invalid"] || "A valid email address is required.");
      return;
    }

    startTransition(async () => {
      const res = await createUserAction({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        customPassword: autoGenerate ? undefined : customPassword.trim(),
        sendEmailNotification,
        emailVerified,
      });

      if (!res.success) {
        setError(res.error || "Failed to create user.");
        return;
      }

      if (res.plainPassword) {
        setCreatedCredentials({
          email: email.trim().toLowerCase(),
          password: res.plainPassword,
        });
      } else {
        handleOpenChange(false);
      }
      onSuccess();
    });
  };

  const copyToClipboard = () => {
    if (!createdCredentials) return;
    const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir={direction} className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {createdCredentials
              ? dict["admin.users.credentials_title"] || "User Credentials Created"
              : dict["admin.users.add_new_title"] || "Add New User"}
          </DialogTitle>
        </DialogHeader>

        {createdCredentials ? (
          <div className="space-y-4 py-2 text-[13px]">
            <div className="rounded border border-[#00a32a] bg-[#f0f6f0] p-3 text-[#00a32a]">
              {dict["admin.users.created_success_msg"] ||
                "User has been successfully created with the following login details:"}
            </div>

            <div className="space-y-2 rounded border border-[#c3c4c7] bg-[#f6f7f7] p-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#646970]">
                  {dict["admin.users.email"] || dict["admin.users.col_email"] || "Email"}:
                </span>
                <span className="font-semibold text-[#1d2327]">
                  {createdCredentials.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#646970]">
                  {dict["admin.users.password"] || "Password"}:
                </span>
                <span className="font-semibold text-[#1d2327]">
                  {createdCredentials.password}
                </span>
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
                  : dict["admin.users.copy_credentials"] || "Copy Details"}
              </button>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="rounded-[3px] bg-[#2271b1] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#135e96]"
              >
                {dict["admin.common.done"] || "Done"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3.5 py-2 text-[13px]">
            {error && (
              <div className="rounded border-s-4 border-[#d63638] bg-[#fcf0f1] p-2.5 text-xs text-[#d63638]">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="mb-1 block font-medium text-[#1d2327]">
                {dict["admin.users.name"] || "Name"} <span className="text-[#d63638]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={dict["admin.users.name_placeholder"] || "Full Name"}
                className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block font-medium text-[#1d2327]">
                {dict["admin.users.email"] || "Email"} <span className="text-[#d63638]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block font-medium text-[#1d2327]">
                {dict["admin.users.role"] || "Role"}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {dict[`admin.roles.${r.value.toLowerCase()}`] || r.label || r.value}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="font-medium text-[#1d2327]">
                  {dict["admin.users.password"] || "Password"}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#50575e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="size-3.5 rounded border-[#8c8f94] text-[#2271b1]"
                  />
                  {dict["admin.users.auto_generate"] || dict["admin.users.auto_generate_password"] || "Auto-generate strong password"}
                </label>
              </div>

              {!autoGenerate && (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder={dict["admin.users.enter_password"] || dict["admin.users.custom_password"] || "Enter secure password"}
                    className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white pe-9 ps-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-2 top-2 text-[#646970] hover:text-[#1d2327]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-[#50575e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailVerified}
                  onChange={(e) => setEmailVerified(e.target.checked)}
                  className="size-4 rounded border-[#8c8f94] text-[#2271b1]"
                />
                {dict["admin.users.mark_email_verified"] || "Mark email as verified"}
              </label>

              <label className="flex items-center gap-2 text-xs text-[#50575e] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  className="size-4 rounded border-[#8c8f94] text-[#2271b1]"
                />
                {dict["admin.users.send_notification"] || dict["admin.users.send_credentials_email"] || "Send user email notification with login details"}
              </label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="h-[30px] rounded-[3px] border border-[#c3c4c7] bg-white px-3 text-[13px] text-[#2c3338] hover:bg-[#f6f7f7]"
              >
                {dict["admin.common.cancel"] || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="h-[30px] rounded-[3px] bg-[#2271b1] px-4 text-[13px] font-medium text-white hover:bg-[#135e96] disabled:opacity-50"
              >
                {isPending
                  ? dict["admin.common.saving"] || "Creating..."
                  : dict["admin.users.create_user_btn"] || "Add User"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
