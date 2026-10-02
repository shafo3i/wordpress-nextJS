"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Shield, ArrowUpDown } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { UserFilter } from "./user-filter";
import { UserTablenav } from "./user-tablenav";
import { UserRowItem } from "./user-row-item";
import { CreateUserModal } from "./create-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { ResetPasswordModal } from "./reset-password-modal";
import { ManageRolesModal } from "./manage-roles-modal";
import {
  deleteUserAction,
  bulkDeleteUsersAction,
  bulkUpdateUsersRoleAction,
} from "../action";
import type {
  UserItem,
  UserRoleOption,
  Counts,
} from "@/services/user.service";

interface UserTableProps {
  users: UserItem[];
  counts: Counts;
  roles: UserRoleOption[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize?: number;
  searchQuery?: string;
  currentRole?: string;
  currentUserId: string;
  direction?: "rtl" | "ltr";
  dict?: Record<string, string>;
}

export function UserTable({
  users,
  counts,
  roles,
  totalItems,
  currentPage,
  totalPages,
  pageSize = 20,
  searchQuery = "",
  currentRole = "all",
  currentUserId,
  direction = "ltr",
  dict = {},
}: UserTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [selectedRoleChange, setSelectedRoleChange] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState<UserItem | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserItem | null>(null);
  const [manageRolesOpen, setManageRolesOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  const [isPending, startTransition] = useTransition();

  const selectableUsers = users.filter((u) => u.id !== currentUserId);
  const allSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedIds.includes(u.id));

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? selectableUsers.map((u) => u.id) : []);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, id])] : prev.filter((item) => item !== id)
    );
  };

  const handleApplyBulkAction = () => {
    if (!selectedIds.length || bulkAction !== "delete") return;

    setConfirmDialog({
      open: true,
      title: dict["admin.users.bulk_delete_title"] || "Delete Users",
      description:
        dict["admin.users.bulk_delete_confirm"] ||
        `Are you sure you want to delete ${selectedIds.length} selected users?`,
      action: () => {
        startTransition(async () => {
          const res = await bulkDeleteUsersAction(selectedIds);
          if (!res.success) {
            setNotice({ type: "error", message: res.error || "Failed to delete users." });
          } else {
            setNotice({
              type: "success",
              message: `${selectedIds.length} ${
                dict["admin.users.bulk_deleted_notice"] || "users deleted successfully."
              }`,
            });
            setSelectedIds([]);
            setBulkAction("");
            router.refresh();
          }
        });
      },
    });
  };

  const handleApplyRoleChange = () => {
    if (!selectedIds.length || !selectedRoleChange) return;

    startTransition(async () => {
      const res = await bulkUpdateUsersRoleAction(selectedIds, selectedRoleChange);
      if (!res.success) {
        setNotice({ type: "error", message: res.error || "Failed to change roles." });
      } else {
        setNotice({
          type: "success",
          message: dict["admin.users.role_updated_notice"] || "Roles updated successfully.",
        });
        setSelectedIds([]);
        setSelectedRoleChange("");
        router.refresh();
      }
    });
  };

  const handleDeleteOne = (userToDelete: UserItem) => {
    setConfirmDialog({
      open: true,
      title: dict["admin.users.delete_user_title"] || "Delete User",
      description: `${dict["admin.users.delete_confirm"] || "Are you sure you want to delete user"} "${
        userToDelete.name || userToDelete.email
      }"?`,
      action: () => {
        startTransition(async () => {
          const res = await deleteUserAction(userToDelete.id);
          if (!res.success) {
            setNotice({ type: "error", message: res.error || "Failed to delete user." });
          } else {
            setNotice({
              type: "success",
              message: dict["admin.users.deleted_notice"] || "User deleted successfully.",
            });
            setSelectedIds((prev) => prev.filter((id) => id !== userToDelete.id));
            router.refresh();
          }
        });
      },
    });
  };

  return (
    <div className="space-y-3" dir={direction}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[23px] font-normal leading-normal text-[#1d2327]">
            {dict["admin.menu.users"] || "Users"}
          </h1>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-2.5 py-0.5 text-[13px] font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer"
          >
            <Plus className="size-3.5" />
            {dict["admin.users.add_new"] || "Add New User"}
          </button>
          <button
            type="button"
            onClick={() => setManageRolesOpen(true)}
            className="inline-flex items-center gap-1 rounded-[3px] border border-[#c3c4c7] bg-white px-2.5 py-0.5 text-[13px] font-medium text-[#50575e] hover:border-[#8c8f94] hover:text-[#1d2327] cursor-pointer"
          >
            <Shield className="size-3.5" />
            {dict["admin.roles.manage_roles"] || dict["admin.users.manage_roles"] || "Manage Roles"}
          </button>
        </div>
      </div>

      {/* Notice Message */}
      {notice && (
        <div
          className={`border-s-4 p-2.5 text-xs ${
            notice.type === "error"
              ? "border-[#d63638] bg-[#fcf0f1] text-[#d63638]"
              : "border-[#00a32a] bg-[#f0f6f0] text-[#00a32a]"
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* Role Filter Tabs & Search Form */}
      <UserFilter
        counts={counts}
        roles={roles}
        currentRole={currentRole}
        searchQuery={searchQuery}
        dict={dict}
      />

      {/* Top Tablenav */}
      <UserTablenav
        position="top"
        bulkAction={bulkAction}
        onBulkActionChange={setBulkAction}
        onApplyBulkAction={handleApplyBulkAction}
        selectedRoleChange={selectedRoleChange}
        onRoleChangeSelect={setSelectedRoleChange}
        onApplyRoleChange={handleApplyRoleChange}
        hasSelected={selectedIds.length > 0}
        isPending={isPending}
        roles={roles}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        searchQuery={searchQuery}
        role={currentRole}
        dict={dict}
      />

      {/* WordPress Widefat Fixed Striped Users Table */}
      <div className="overflow-x-auto border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <table className="w-full min-w-[700px] border-collapse text-start text-[13px]">
          <thead className="border-b border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  aria-label={dict["admin.common.select_all"] || "Select all"}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.users.username"] || dict["admin.users.col_username"] || "Username"}{" "}
                <ArrowUpDown className="inline size-3 text-[#a7aaad]" />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.users.name"] || dict["admin.users.col_name"] || "Name"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.users.email"] || dict["admin.users.col_email"] || "Email"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.users.role"] || dict["admin.users.col_role"] || "Role"}
              </th>
              <th className="w-20 px-3 py-2 text-start font-semibold">
                {dict["admin.users.posts"] || dict["admin.users.col_posts"] || "Posts"}
              </th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#646970]">
                  {dict["admin.users.no_users_found"] || "No users found."}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <UserRowItem
                  key={u.id}
                  user={u}
                  isSelected={selectedIds.includes(u.id)}
                  isCurrentUser={u.id === currentUserId}
                  onToggleSelect={(checked) => toggleSelectOne(u.id, checked)}
                  onEdit={(target) => setEditModalUser(target)}
                  onResetPassword={(target) => setResetPasswordUser(target)}
                  onDelete={(target) => handleDeleteOne(target)}
                  roles={roles}
                  dict={dict}
                />
              ))
            )}
          </tbody>

          <tfoot className="border-t border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  aria-label={dict["admin.common.select_all"] || "Select all"}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.users.username"] || dict["admin.users.col_username"] || "Username"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.users.name"] || dict["admin.users.col_name"] || "Name"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.users.email"] || dict["admin.users.col_email"] || "Email"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.users.role"] || dict["admin.users.col_role"] || "Role"}
              </th>
              <th className="w-20 px-3 py-2 text-start font-semibold">
                {dict["admin.users.posts"] || dict["admin.users.col_posts"] || "Posts"}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Tablenav */}
      <UserTablenav
        position="bottom"
        bulkAction={bulkAction}
        onBulkActionChange={setBulkAction}
        onApplyBulkAction={handleApplyBulkAction}
        selectedRoleChange={selectedRoleChange}
        onRoleChangeSelect={setSelectedRoleChange}
        onApplyRoleChange={handleApplyRoleChange}
        hasSelected={selectedIds.length > 0}
        isPending={isPending}
        roles={roles}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        searchQuery={searchQuery}
        role={currentRole}
        dict={dict}
      />

      {/* Modals */}
      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        roles={roles}
        direction={direction}
        dict={dict}
        onSuccess={() => router.refresh()}
      />

      <EditUserModal
        user={editModalUser}
        open={Boolean(editModalUser)}
        onOpenChange={(open) => !open && setEditModalUser(null)}
        roles={roles}
        direction={direction}
        dict={dict}
        onSuccess={() => router.refresh()}
      />

      <ResetPasswordModal
        user={resetPasswordUser}
        open={Boolean(resetPasswordUser)}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
        direction={direction}
        dict={dict}
        onSuccess={() => router.refresh()}
      />

      <ManageRolesModal
        open={manageRolesOpen}
        onOpenChange={setManageRolesOpen}
        roles={roles}
        direction={direction}
        dict={dict}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((p) => ({ ...p, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        direction={direction}
        dict={dict}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
}
