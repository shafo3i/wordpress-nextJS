"use client";

import { UserPagination } from "./user-pagination";
import type { UserRoleOption } from "@/services/user.service";

interface UserTablenavProps {
  position?: "top" | "bottom";
  bulkAction: string;
  onBulkActionChange: (action: string) => void;
  onApplyBulkAction: () => void;
  selectedRoleChange: string;
  onRoleChangeSelect: (role: string) => void;
  onApplyRoleChange: () => void;
  hasSelected: boolean;
  isPending: boolean;
  roles: UserRoleOption[];
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  searchQuery?: string;
  role?: string;
  dict?: Record<string, string>;
}

export function UserTablenav({
  position = "top",
  bulkAction,
  onBulkActionChange,
  onApplyBulkAction,
  selectedRoleChange,
  onRoleChangeSelect,
  onApplyRoleChange,
  hasSelected,
  isPending,
  roles,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  searchQuery = "",
  role = "",
  dict = {},
}: UserTablenavProps) {
  const getRoleLabel = (r: UserRoleOption) => {
    const key = `admin.roles.${r.value.toLowerCase()}`;
    return dict[key] || r.label || r.value;
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-[13px] ${position === "top" ? "mb-2" : "mt-3"
        }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Bulk Action Controls */}
        <div className="flex items-center gap-1">
          <select
            value={bulkAction}
            onChange={(e) => onBulkActionChange(e.target.value)}
            disabled={isPending}
            aria-label={dict["admin.users.bulk_actions"] || dict["admin.common.bulk_actions"] || "Bulk actions"}
            className="h-7.5 rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
          >
            <option value="">
              {dict["admin.users.bulk_actions"] || dict["admin.common.bulk_actions"] || "Bulk actions"}
            </option>
            <option value="delete">
              {dict["admin.users.delete"] || dict["admin.common.delete"] || "Delete"}
            </option>
          </select>

          <button
            type="button"
            onClick={onApplyBulkAction}
            disabled={!hasSelected || !bulkAction || isPending}
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:cursor-not-allowed disabled:border-[#dcdcde] disabled:bg-[#f6f7f7] disabled:text-[#a7aaad] cursor-pointer"
          >
            {dict["admin.users.apply"] || dict["admin.common.apply"] || "Apply"}
          </button>
        </div>

        {/* Change Role To Controls */}
        <div className="flex items-center gap-1 ms-2">
          <select
            value={selectedRoleChange}
            onChange={(e) => onRoleChangeSelect(e.target.value)}
            disabled={isPending}
            aria-label={dict["admin.users.change_role_to"] || "Change role to..."}
            className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
          >
            <option value="">
              {dict["admin.users.change_role_to"] || "Change role to…"}
            </option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {getRoleLabel(r)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onApplyRoleChange}
            disabled={!hasSelected || !selectedRoleChange || isPending}
            className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:cursor-not-allowed disabled:border-[#dcdcde] disabled:bg-[#f6f7f7] disabled:text-[#a7aaad] cursor-pointer"
          >
            {dict["admin.users.change_role_btn"] || dict["admin.users.change"] || "Change"}
          </button>
        </div>
      </div>

      {/* Pagination Controls */}
      <UserPagination
        position={position}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        searchQuery={searchQuery}
        role={role}
        dict={dict}
      />
    </div>
  );
}
