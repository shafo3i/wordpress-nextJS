"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateUserAction } from "../action";
import type { UserItem, UserRoleOption } from "@/services/user.service";

interface EditUserModalProps {
  user: UserItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: UserRoleOption[];
  direction?: "rtl" | "ltr";
  dict?: Record<string, string>;
  onSuccess: () => void;
}

export function EditUserModal({
  user,
  open,
  onOpenChange,
  roles,
  direction = "ltr",
  dict = {},
  onSuccess,
}: EditUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("subscriber");
  const [emailVerified, setEmailVerified] = useState(false);
  const [banned, setBanned] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "subscriber");
      setEmailVerified(Boolean(user.emailVerified));
      setBanned(Boolean(user.banned));
      setBanReason(user.banReason || "");
      setError(null);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    startTransition(async () => {
      const res = await updateUserAction({
        id: user.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        emailVerified,
        banned,
        banReason: banned ? banReason.trim() : null,
      });

      if (!res.success) {
        setError(res.error || "Failed to update user.");
        return;
      }

      onOpenChange(false);
      onSuccess();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={direction} className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {dict["admin.users.edit_user_title"] || "Edit User"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-2 text-[13px]">
          {error && (
            <div className="rounded border-s-4 border-[#d63638] bg-[#fcf0f1] p-2.5 text-xs text-[#d63638]">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="mb-1 block font-medium text-[#1d2327]">
              {dict["admin.users.name"] || "Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-[32px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2.5 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block font-medium text-[#1d2327]">
              {dict["admin.users.email"] || "Email"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          {/* Email Verified Checkbox */}
          <div>
            <label className="flex items-center gap-2 text-xs text-[#50575e] cursor-pointer">
              <input
                type="checkbox"
                checked={emailVerified}
                onChange={(e) => setEmailVerified(e.target.checked)}
                className="size-4 rounded border-[#8c8f94] text-[#2271b1]"
              />
              {dict["admin.users.email_verified"] || "Email verified"}
            </label>
          </div>

          {/* Ban User Section */}
          <div className="rounded border border-[#f0f0f1] bg-[#fdfdfd] p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#d63638] cursor-pointer">
              <input
                type="checkbox"
                checked={banned}
                onChange={(e) => setBanned(e.target.checked)}
                className="size-4 rounded border-[#d63638] text-[#d63638] focus:ring-[#d63638]"
              />
              {dict["admin.users.ban_account"] || "Ban user account"}
            </label>

            {banned && (
              <div>
                <label className="mb-1 block text-xs text-[#646970]">
                  {dict["admin.users.ban_reason"] || "Ban reason"}
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder={dict["admin.users.ban_reason_placeholder"] || "Violation of terms..."}
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
                />
              </div>
            )}
          </div>

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
              disabled={isPending}
              className="h-[30px] rounded-[3px] bg-[#2271b1] px-4 text-[13px] font-medium text-white hover:bg-[#135e96] disabled:opacity-50"
            >
              {isPending
                ? dict["admin.common.saving"] || dict["admin.users.saving"] || "Saving..."
                : dict["admin.users.save_changes"] || dict["admin.common.save_changes"] || dict["admin.profile.save_changes"] || dict["common.save"] || "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
