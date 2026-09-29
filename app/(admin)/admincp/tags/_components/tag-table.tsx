"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { deleteTags } from "../action";
import { TagRowItem } from "./tag-row-item";
import { TagQuickEditRow } from "./tag-quick-edit-row";
import { TagTablenav } from "./tag-tablenav";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { TagItem } from "@/services/tag.service";
import type { SelectLanguage } from "@/db/schema/cms-languages";

export function TagTable({
  tags: initialTags,
  totalItems,
  currentPage = 1,
  pageSize = 20,
  totalPages = 1,
  searchQuery = "",
  direction = "ltr",
  languages = [],
  currentLanguage = "all",
  dict = {},
}: {
  tags: TagItem[];
  totalItems: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  searchQuery?: string;
  direction?: string;
  languages?: SelectLanguage[];
  currentLanguage?: string;
  dict?: Record<string, string>;
}) {
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("Bulk actions");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => { },
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (initialTags !== tags && !quickEditId) {
    setTags(initialTags);
  }

  const allSelected = tags.length > 0 && selectedIds.length === tags.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? tags.map((t) => t.id) : []);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((curr) =>
      checked ? [...new Set([...curr, id])] : curr.filter((i) => i !== id)
    );
  };

  const handleApplyBulkAction = () => {
    if (!selectedIds.length || bulkAction !== "delete") return;

    setConfirmDialog({
      open: true,
      title: dict["admin.tags.bulk_delete_title"] || "Delete Tags",
      description:
        dict["admin.tags.bulk_delete_confirm"] ||
        "Are you sure you want to delete the selected tags?",
      action: () => {
        startTransition(async () => {
          const res = await deleteTags(selectedIds);
          if (res?.error) {
            setNotice({ type: "error", message: res.error });
          } else {
            setNotice({
              type: "success",
              message: `${selectedIds.length} ${dict["admin.tags.bulk_deleted_notice"] || "tags deleted."}`,
            });
          }
          setSelectedIds([]);
          setBulkAction("Bulk actions");
          router.refresh();
        });
      },
    });
  };

  const handleDeleteOne = (id: string) => {
    setConfirmDialog({
      open: true,
      title: dict["admin.tags.delete_title"] || "Delete Tag",
      description:
        dict["admin.tags.delete_confirm"] ||
        "Are you sure you want to delete this tag?",
      action: () => {
        startTransition(async () => {
          const res = await deleteTags([id]);
          if (res?.error) {
            setNotice({ type: "error", message: res.error });
          } else {
            setNotice({
              type: "success",
              message: dict["admin.tags.deleted_notice"] || "Tag deleted.",
            });
          }
          router.refresh();
        });
      },
    });
  };

  const handleQuickEditSuccess = (updated: { id: string; name: string; slug: string }) => {
    setTags((curr) =>
      curr.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
    );
    setQuickEditId(null);
    setNotice({
      type: "success",
      message: dict["admin.tags.updated_notice"] || "Tag updated.",
    });
    router.refresh();
  };

  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set("s", searchQuery);
  if (currentLanguage && currentLanguage !== "all") queryParams.set("lang", currentLanguage);
  const queryString = queryParams.toString();

  return (
    <div>
      {/* Notice Message */}
      {notice && (
        <div
          className={`mb-3 border-l-4 p-2.5 text-xs ${notice.type === "error"
            ? "border-[#d63638] bg-[#fcf0f1] text-[#d63638]"
            : "border-[#00a32a] bg-[#f0f6f0] text-[#00a32a]"
            }`}
        >
          {notice.message}
        </div>
      )}

      {/* Top Tablenav */}
      <TagTablenav
        bulkAction={bulkAction}
        currentPage={currentPage}
        currentLanguage={currentLanguage}
        dict={dict}
        hasSelected={selectedIds.length > 0}
        isPending={isPending}
        languages={languages}
        onApplyBulkAction={handleApplyBulkAction}
        onBulkActionChange={setBulkAction}
        position="top"
        queryString={queryString}
        totalItems={totalItems}
        totalPages={totalPages}
      />

      {/* WordPress Widefat Fixed Striped Tags Table */}
      <div
        className="overflow-x-auto border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
        dir={direction}
      >
        <table className="w-full min-w-[500px] border-collapse text-start text-[13px]" dir={direction}>
          <thead className="border-b border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  aria-label={dict["admin.common.select_all"] || "Select all tags"}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.tags.table.name"] || "Name"}{" "}
                <ArrowUpDown className="inline size-3 text-[#a7aaad]" />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.tags.table.description"] || "Description"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.tags.table.slug"] || "Slug"}
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                {dict["admin.tags.table.count"] || "Count"}
              </th>
            </tr>
          </thead>

          <tbody>
            {tags.length ? (
              tags.map((tag) =>
                quickEditId === tag.id ? (
                  <TagQuickEditRow
                    dict={dict}
                    key={`quick-edit-${tag.id}`}
                    onCancel={() => setQuickEditId(null)}
                    onSuccess={handleQuickEditSuccess}
                    tag={tag}
                  />
                ) : (
                  <TagRowItem
                    dict={dict}
                    isSelected={selectedIds.includes(tag.id)}
                    key={tag.id}
                    onDelete={() => handleDeleteOne(tag.id)}
                    onQuickEdit={() => setQuickEditId(tag.id)}
                    onToggleSelect={(checked) => toggleSelectOne(tag.id, checked)}
                    tag={tag}
                  />
                )
              )
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-[#646970]" colSpan={5}>
                  {dict["admin.tags.table.no_tags"] || "No tags found."}
                </td>
              </tr>
            )}
          </tbody>

          <tfoot className="border-t border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  aria-label={dict["admin.common.select_all"] || "Select all tags bottom"}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.tags.table.name"] || "Name"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.tags.table.description"] || "Description"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.tags.table.slug"] || "Slug"}
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                {dict["admin.tags.table.count"] || "Count"}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Tablenav */}
      <TagTablenav
        bulkAction={bulkAction}
        currentPage={currentPage}
        currentLanguage={currentLanguage}
        dict={dict}
        hasSelected={selectedIds.length > 0}
        isPending={isPending}
        languages={languages}
        onApplyBulkAction={handleApplyBulkAction}
        onBulkActionChange={setBulkAction}
        position="bottom"
        queryString={queryString}
        totalItems={totalItems}
        totalPages={totalPages}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        direction={direction}
        dict={dict}
        confirmText={dict["admin.common.delete"] || "Delete"}
        cancelText={dict["admin.common.cancel"] || "Cancel"}
        onConfirm={confirmDialog.action}
        isLoading={isPending}
      />
    </div>
  );
}
