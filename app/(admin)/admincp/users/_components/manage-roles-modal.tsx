"use client";

import { useState, useTransition } from "react";
import { Trash2, Shield, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { addRoleAction, deleteRoleAction } from "../action";
import type { UserRoleOption } from "@/services/user.service";

interface ManageRolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: UserRoleOption[];
  direction?: "rtl" | "ltr";
  dict?: Record<string, string>;
  onSuccess: () => void;
}

export function ManageRolesModal({
  open,
  onOpenChange,
  roles,
  direction = "ltr",
  dict = {},
  onSuccess,
}: ManageRolesModalProps) {
  const [roleValue, setRoleValue] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleValue.trim() || !roleLabel.trim()) return;
    setError(null);

    startTransition(async () => {
      const res = await addRoleAction({
        value: roleValue.trim().toLowerCase(),
        label: roleLabel.trim(),
      });

      if (!res.success) {
        setError(res.error || "Failed to add role.");
        return;
      }

      setRoleValue("");
      setRoleLabel("");
      onSuccess();
    });
  };

  const handleDelete = (value: string) => {
    if (confirm(dict["admin.roles.delete_confirm"] || "Are you sure you want to delete this role?")) {
      startTransition(async () => {
        const res = await deleteRoleAction(value);
        if (!res.success) {
          setError(res.error || "Failed to delete role.");
          return;
        }
        onSuccess();
      });
    }
  };

  const getRoleDisplayName = (r: UserRoleOption) => {
    const key = `admin.roles.${r.value.toLowerCase()}`;
    return dict[key] || r.label || r.value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={direction} className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {dict["admin.roles.manage_title"] || "Manage User Roles"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-[13px]">
          {error && (
            <div className="rounded border-s-4 border-[#d63638] bg-[#fcf0f1] p-2.5 text-xs text-[#d63638]">
              {error}
            </div>
          )}

          {/* Current Roles List */}
          <div>
            <h4 className="mb-2 font-medium text-[#1d2327]">
              {dict["admin.roles.available_roles"] || "Available Roles"}
            </h4>
            <div className="max-h-48 overflow-y-auto divide-y divide-[#f0f0f1] rounded border border-[#c3c4c7] bg-white">
              {roles.map((r) => (
                <div
                  key={r.value}
                  className="flex items-center justify-between px-3 py-2 text-[13px]"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-[#50575e]" />
                    <span className="font-medium text-[#1d2327]">
                      {getRoleDisplayName(r)}
                    </span>
                    <span className="font-mono text-xs text-[#646970]">
                      ({r.value})
                    </span>
                    {r.isDefault && (
                      <span className="rounded bg-[#f0f0f1] px-1.5 py-0.5 text-[10px] text-[#50575e]">
                        {dict["admin.roles.system"] || "System"}
                      </span>
                    )}
                  </div>

                  {!r.isDefault && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(r.value)}
                      title={dict["admin.roles.delete_role"] || "Delete Role"}
                      className="text-[#d63638] hover:text-[#b32d2e] cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Custom Role Form */}
          <form
            onSubmit={handleAdd}
            className="space-y-2 rounded border border-[#c3c4c7] bg-[#f6f7f7] p-3"
          >
            <h4 className="font-medium text-[#1d2327]">
              {dict["admin.roles.add_custom_role"] || dict["admin.users.add_new_role"] || "Add Custom Role"}
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[#646970]">
                  {dict["admin.roles.role_key"] || dict["admin.users.role_identifier"] || "Role Key"}
                </label>
                <input
                  type="text"
                  required
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="moderator"
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#646970]">
                  {dict["admin.roles.role_name"] || dict["admin.users.role_display_name"] || "Display Name"}
                </label>
                <input
                  type="text"
                  required
                  value={roleLabel}
                  onChange={(e) => setRoleLabel(e.target.value)}
                  placeholder="Moderator"
                  className="h-[30px] w-full rounded-[3px] border border-[#8c8f94] bg-white px-2 text-xs text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isPending || !roleValue.trim() || !roleLabel.trim()}
                className="flex items-center gap-1 rounded-[3px] bg-[#2271b1] px-3 py-1 text-xs font-medium text-white hover:bg-[#135e96] disabled:opacity-50 cursor-pointer"
              >
                <Plus className="size-3.5" />
                {dict["admin.roles.add_btn"] || dict["admin.users.add_role_button"] || "Add Role"}
              </button>
            </div>
          </form>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[30px] rounded-[3px] border border-[#c3c4c7] bg-white px-4 text-[13px] text-[#2c3338] hover:bg-[#f6f7f7]"
            >
              {dict["admin.common.close"] || dict["common.close"] || dict["admin.common.cancel"] || "Close"}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
