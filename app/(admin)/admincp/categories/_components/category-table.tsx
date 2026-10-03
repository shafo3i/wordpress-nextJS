"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { deleteCategories } from "../action";
import { CategoryRowItem } from "./category-row-item";
import { CategoryQuickEditRow } from "./category-quick-edit-row";
import { CategoryTablenav } from "./category-tablenav";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { CategoryItem } from "@/services/category.service";
import type { SelectLanguage } from "@/db/schema/cms-languages";

export function CategoryTable({
  categories: initialCategories,
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
  categories: CategoryItem[];
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
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
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
    action: () => {},
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (initialCategories !== categories && !quickEditId) {
    setCategories(initialCategories);
  }

  const selectableCategories = categories.filter((c) => c.slug !== "uncategorized");
  const allSelected =
    selectableCategories.length > 0 && selectedIds.length === selectableCategories.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? selectableCategories.map((c) => c.id) : []);
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
      title: dict["admin.categories.bulk_delete_title"] || "Delete Categories",
      description:
        dict["admin.categories.bulk_delete_confirm"] ||
        "Are you sure you want to delete the selected categories?",
      action: () => {
        startTransition(async () => {
          const res = await deleteCategories(selectedIds);
          if (res?.error) {
            setNotice({ type: "error", message: res.error });
          } else {
            setNotice({
              type: "success",
              message: `${selectedIds.length} ${dict["admin.categories.bulk_deleted_notice"] || "categories deleted."}`,
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
      title: dict["admin.categories.delete_title"] || "Delete Category",
      description:
        dict["admin.categories.delete_confirm"] ||
        "Are you sure you want to delete this category?",
      action: () => {
        startTransition(async () => {
          const res = await deleteCategories([id]);
          if (res?.error) {
            setNotice({ type: "error", message: res.error });
          } else {
            setNotice({
              type: "success",
              message: dict["admin.categories.deleted_notice"] || "Category deleted.",
            });
          }
          router.refresh();
        });
      },
    });
  };

  const handleQuickEditSuccess = (updated: { id: string; name: string; slug: string }) => {
    setCategories((curr) =>
      curr.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
    setQuickEditId(null);
    setNotice({
      type: "success",
      message: dict["admin.categories.updated_notice"] || "Category updated.",
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
      <CategoryTablenav
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
                  aria-label={dict["admin.common.select_all"] || "Select all categories"}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.categories.table.name"] || "Name"}{" "}
                <ArrowUpDown className="inline size-3 text-[#a7aaad]" />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.categories.table.description"] || "Description"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.categories.table.slug"] || "Slug"}
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                {dict["admin.common.language"] || "Language"}
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                {dict["admin.categories.table.count"] || "Count"}
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.length ? (
              categories.map((category) =>
                quickEditId === category.id ? (
                  <CategoryQuickEditRow
                    category={category}
                    dict={dict}
                    key={`quick-edit-${category.id}`}
                    onCancel={() => setQuickEditId(null)}
                    onSuccess={handleQuickEditSuccess}
                  />
                ) : (
                  <CategoryRowItem
                    category={category}
                    dict={dict}
                    isSelected={selectedIds.includes(category.id)}
                    key={category.id}
                    languages={languages}
                    onDelete={() => handleDeleteOne(category.id)}
                    onQuickEdit={() => setQuickEditId(category.id)}
                    onToggleSelect={(checked) => toggleSelectOne(category.id, checked)}
                  />
                )
              )
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-[#646970]" colSpan={6}>
                  {dict["admin.categories.table.no_categories"] || "No categories found."}
                </td>
              </tr>
            )}
          </tbody>

          <tfoot className="border-t border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  aria-label={dict["admin.common.select_all"] || "Select all categories bottom"}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.categories.table.name"] || "Name"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.categories.table.description"] || "Description"}
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.categories.table.slug"] || "Slug"}
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                {dict["admin.common.language"] || "Language"}
              </th>
              <th className="px-3 py-2 text-center font-semibold">
                {dict["admin.categories.table.count"] || "Count"}
              </th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Tablenav */}
      <CategoryTablenav
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
