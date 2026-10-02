"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, XCircle, ShieldAlert, KeyRound } from "lucide-react";
import type { UserItem, UserRoleOption } from "@/services/user.service";

interface UserRowItemProps {
  user: UserItem;
  isSelected: boolean;
  isCurrentUser: boolean;
  onToggleSelect: (checked: boolean) => void;
  onEdit: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
  roles: UserRoleOption[];
  dict?: Record<string, string>;
}

export function UserRowItem({
  user,
  isSelected,
  isCurrentUser,
  onToggleSelect,
  onEdit,
  onResetPassword,
  onDelete,
  roles,
  dict = {},
}: UserRowItemProps) {
  const getRoleLabel = (roleVal: string) => {
    const key = `admin.roles.${roleVal.toLowerCase()}`;
    if (dict[key]) return dict[key];
    const match = roles.find((r) => r.value.toLowerCase() === roleVal.toLowerCase());
    return match?.label || roleVal;
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (email?.slice(0, 2) || "U").toUpperCase();
  };

  return (
    <tr className="group border-b border-[#f0f0f1] bg-white hover:bg-[#f6f7f7] last:border-b-0">
      {/* Checkbox */}
      <td className="w-8 px-3 py-2 text-center align-top">
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isCurrentUser}
          onChange={(e) => onToggleSelect(e.target.checked)}
          aria-label={`Select ${user.name || user.email}`}
          className="mt-1 h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] disabled:opacity-30 cursor-pointer"
        />
      </td>

      {/* Username / Avatar + Row Actions */}
      <td className="px-3 py-2 text-start align-top">
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div className="relative size-8 shrink-0 overflow-hidden rounded bg-[#dcdcde] text-[#50575e] flex items-center justify-center text-xs font-semibold select-none">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || user.email}
                fill
                className="object-cover"
              />
            ) : (
              <span>{getInitials(user.name, user.email)}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(user)}
                className="text-start text-[14px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
              >
                {user.name || user.email.split("@")[0]}
              </button>

              {isCurrentUser && (
                <span className="rounded bg-[#f0f0f1] px-1.5 py-0.2 text-[11px] font-medium text-[#50575e]">
                  {dict["admin.users.you"] || "(You)"}
                </span>
              )}

              {user.banned && (
                <span className="flex items-center gap-0.5 rounded bg-[#fcf0f1] px-1.5 py-0.2 text-[11px] font-medium text-[#d63638]">
                  <ShieldAlert className="size-3" />
                  {dict["admin.users.banned"] || "Banned"}
                </span>
              )}

              {user.twoFactorEnabled && (
                <span className="flex items-center gap-0.5 rounded bg-[#f0f6f0] px-1.5 py-0.2 text-[11px] font-medium text-[#00a32a]">
                  <KeyRound className="size-3" />
                  2FA
                </span>
              )}
            </div>

            {/* Hover Row Actions */}
            <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#a7aaad] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onEdit(user)}
                className="text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
              >
                {dict["admin.users.edit"] || dict["admin.common.edit"] || "Edit"}
              </button>

              <span className="text-[#c3c4c7]">|</span>

              <button
                type="button"
                onClick={() => onResetPassword(user)}
                className="text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer"
              >
                {dict["admin.users.reset_password"] || "Reset Password"}
              </button>

              <span className="text-[#c3c4c7]">|</span>

              <Link
                href={`/admincp/posts?author=${user.id}`}
                className="text-[#2271b1] hover:text-[#135e96] hover:underline"
              >
                {dict["admin.users.view_posts"] || "View Posts"}
              </Link>

              {!isCurrentUser && (
                <>
                  <span className="text-[#c3c4c7]">|</span>
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
                    className="text-[#d63638] hover:text-[#b32d2e] hover:underline cursor-pointer"
                  >
                    {dict["admin.users.delete"] || dict["admin.common.delete"] || dict["admin.users.delete_user"] || "Delete"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Name */}
      <td className="px-3 py-2 text-start align-top text-[#2c3338]">
        {user.name || "—"}
      </td>

      {/* Email */}
      <td className="px-3 py-2 text-start align-top">
        <div className="flex items-center gap-1.5">
          <a
            href={`mailto:${user.email}`}
            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
          >
            {user.email}
          </a>
          {user.emailVerified ? (
            <span
              title={dict["admin.users.email_verified"] || dict["admin.users.verified"] || "Email Verified"}
              className="text-[#00a32a]"
            >
              <CheckCircle2 className="size-3.5" />
            </span>
          ) : (
            <span
              title={dict["admin.users.email_unverified"] || "Unverified"}
              className="text-[#d63638]"
            >
              <XCircle className="size-3.5" />
            </span>
          )}
        </div>
      </td>

      {/* Role */}
      <td className="px-3 py-2 text-start align-top text-[#2c3338]">
        <span className="inline-block rounded-[3px] bg-[#f0f0f1] px-2 py-0.5 text-xs font-medium text-[#2c3338]">
          {getRoleLabel(user.role)}
        </span>
      </td>

      {/* Posts Count */}
      <td className="px-3 py-2 text-start align-top">
        {user._count?.posts > 0 ? (
          <Link
            href={`/admincp/posts?author=${user.id}`}
            className="font-medium text-[#2271b1] hover:text-[#135e96] hover:underline"
          >
            {user._count.posts}
          </Link>
        ) : (
          <span className="text-[#a7aaad]">0</span>
        )}
      </td>
    </tr>
  );
}
