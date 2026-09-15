"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { deleteCategories } from "@/app/(admin)/admincp/categories/actions";
import { CategoryRowItem, type CategoryRowData } from "./category-row-item";
import { CategoryQuickEditRow } from "./category-quick-edit-row";

export function CategoryListTable({
  categories: initialCategories,
  emptyMessage = "No categories found.",
  onNotice,
}: {
  categories: CategoryRowData[];
  emptyMessage?: string;
  onNotice?: (notice: { type?: "success" | "warning" | "error"; message: string } | null) => void;
}) {
  const [categories, setCategories] = useState<CategoryRowData[]>(initialCategories);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("Bulk actions");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
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
    setSelectedIds((curr) => (checked ? [...new Set([...curr, id])] : curr.filter((i) => i !== id)));
  };

  const handleApplyBulkAction = () => {
    if (!selectedIds.length || bulkAction !== "Delete") return;

    startTransition(async () => {
      const res = await deleteCategories(selectedIds);
      if (res?.error) {
        onNotice?.({ type: "error", message: res.error });
      } else {
        onNotice?.({
          type: "success",
          message: `${selectedIds.length} categories deleted.`,
        });
      }
      setSelectedIds([]);
      setBulkAction("Bulk actions");
      router.refresh();
    });
  };

  const handleDeleteOne = (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    startTransition(async () => {
      const res = await deleteCategories([id]);
      if (res?.error) {
        onNotice?.({ type: "error", message: res.error });
      } else {
        onNotice?.({ type: "success", message: "Category deleted." });
      }
      router.refresh();
    });
  };

  const handleQuickEditSuccess = (updated: { id: string; name: string; slug: string }) => {
    setCategories((curr) =>
      curr.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
    setQuickEditId(null);
    onNotice?.({ type: "success", message: "Category updated." });
    router.refresh();
  };

  const BulkControls = () => (
    <div className="flex items-center gap-1.5 text-[13px]">
      <select
        aria-label="Bulk actions"
        className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
        onChange={(e) => setBulkAction(e.target.value)}
        value={bulkAction}
      >
        <option value="Bulk actions">Bulk actions</option>
        <option value="Delete">Delete</option>
      </select>
      <button
        className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-50"
        disabled={isPending || bulkAction !== "Delete" || !selectedIds.length}
        onClick={handleApplyBulkAction}
        type="button"
      >
        {isPending ? "Applying..." : "Apply"}
      </button>
    </div>
  );

  return (
    <div>
      {/* Top Controls */}
      <div className="mb-2 flex items-center justify-between text-[13px]">
        <BulkControls />
        <span className="text-[#646970]">
          {categories.length} item{categories.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* WordPress Widefat Fixed Striped Tags Table */}
      <div className="overflow-x-auto border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <table className="w-full min-w-[500px] border-collapse text-left text-[13px]">
          <thead className="border-b border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  aria-label="Select all categories"
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 font-semibold">
                Name <ArrowUpDown className="inline size-3 text-[#a7aaad]" />
              </th>
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 font-semibold">Slug</th>
              <th className="px-3 py-2 text-center font-semibold">Count</th>
            </tr>
          </thead>

          <tbody>
            {categories.length ? (
              categories.map((category) =>
                quickEditId === category.id ? (
                  <CategoryQuickEditRow
                    category={category}
                    key={`quick-edit-${category.id}`}
                    onCancel={() => setQuickEditId(null)}
                    onSuccess={handleQuickEditSuccess}
                  />
                ) : (
                  <CategoryRowItem
                    category={category}
                    isSelected={selectedIds.includes(category.id)}
                    key={category.id}
                    onDelete={() => handleDeleteOne(category.id)}
                    onQuickEdit={() => setQuickEditId(category.id)}
                    onToggleSelect={(checked) => toggleSelectOne(category.id, checked)}
                  />
                ),
              )
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-[#646970]" colSpan={5}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>

          <tfoot className="border-t border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  aria-label="Select all categories bottom"
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 font-semibold">Slug</th>
              <th className="px-3 py-2 text-center font-semibold">Count</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Controls */}
      <div className="mt-2 flex items-center justify-between text-[13px]">
        <BulkControls />
        <span className="text-[#646970]">
          {categories.length} item{categories.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
