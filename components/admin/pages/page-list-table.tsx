"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, MessageSquare } from "lucide-react";
import {
  deletePosts,
  movePostsToTrash,
  restorePosts,
} from "@/app/(admin)/admincp/posts/actions";
import { PageTablenav } from "./page-tablenav";
import { PageRowItem, type PageRowData } from "./page-row-item";
import { PageQuickEditRow } from "./page-quick-edit-row";

export function PageListTable({
  pages: initialPages,
  parentPages = [],
  currentDate,
  basePath = "/admincp/pages",
  emptyMessage = "No pages found.",
  pagination,
  onNotice,
}: {
  pages: PageRowData[];
  parentPages?: { id: string; title: string }[];
  currentDate?: string;
  basePath?: string;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    queryString?: string;
  };
  onNotice?: (notice: { type?: "success" | "warning" | "error"; message: string } | null) => void;
}) {
  const [pages, setPages] = useState<PageRowData[]>(initialPages);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("Bulk actions");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (initialPages !== pages && !quickEditId) {
    setPages(initialPages);
  }

  const allSelected = pages.length > 0 && selectedIds.length === pages.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? pages.map((p) => p.id) : []);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((curr) => (checked ? [...new Set([...curr, id])] : curr.filter((i) => i !== id)));
  };

  const handleApplyBulkAction = () => {
    if (!selectedIds.length || bulkAction === "Bulk actions") return;

    startTransition(async () => {
      if (bulkAction === "Move to Trash") {
        await movePostsToTrash(selectedIds);
        onNotice?.({
          type: "success",
          message: `${selectedIds.length} page${selectedIds.length > 1 ? "s" : ""} moved to the Trash.`,
        });
      } else if (bulkAction === "Restore") {
        await restorePosts(selectedIds);
        onNotice?.({
          type: "success",
          message: `${selectedIds.length} page${selectedIds.length > 1 ? "s" : ""} restored.`,
        });
      } else if (bulkAction === "Delete permanently") {
        await deletePosts(selectedIds);
        onNotice?.({
          type: "success",
          message: `${selectedIds.length} page${selectedIds.length > 1 ? "s" : ""} permanently deleted.`,
        });
      }
      setSelectedIds([]);
      setBulkAction("Bulk actions");
      router.refresh();
    });
  };

  const handleRowTrash = (pageId: string) => {
    startTransition(async () => {
      await movePostsToTrash([pageId]);
      onNotice?.({
        type: "success",
        message: "1 page moved to the Trash.",
      });
      router.refresh();
    });
  };

  const handleQuickEditSuccess = (updated: {
    id: string;
    title: string;
    slug: string;
    status: string;
    date: string;
  }) => {
    setPages((curr) =>
      curr.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
    setQuickEditId(null);
    onNotice?.({
      type: "success",
      message: "Page updated.",
    });
    router.refresh();
  };

  return (
    <div>
      {/* Top Tablenav */}
      <PageTablenav
        basePath={basePath}
        bulkAction={bulkAction}
        currentDate={currentDate}
        currentPage={pagination?.currentPage}
        isPending={isPending}
        onApplyBulkAction={handleApplyBulkAction}
        onBulkActionChange={setBulkAction}
        position="top"
        queryString={pagination?.queryString}
        totalItems={pagination?.totalItems ?? pages.length}
        totalPages={pagination?.totalPages}
      />

      {/* WordPress Widefat Fixed Striped Pages Table */}
      <div className="overflow-x-auto border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <table className="w-full min-w-[650px] border-collapse text-left text-[13px]">
          <thead className="border-b border-[#c3c4c7] bg-white text-[13px] text-[#2c3338]">
            <tr>
              <th className="w-8 px-3 py-2 text-center">
                <input
                  aria-label="Select all pages"
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 font-semibold">
                Title <ArrowUpDown className="inline size-3 text-[#a7aaad]" />
              </th>
              <th className="px-3 py-2 font-semibold">Author</th>
              <th className="px-3 py-2 text-center font-semibold">
                <MessageSquare className="inline size-3.5 fill-[#72777c] text-transparent" />
              </th>
              <th className="px-3 py-2 font-semibold">
                Date <ArrowUpDown className="inline size-3 text-[#a7aaad]" />
              </th>
            </tr>
          </thead>

          <tbody>
            {pages.length ? (
              pages.map((page) =>
                quickEditId === page.id ? (
                  <PageQuickEditRow
                    key={`quick-edit-${page.id}`}
                    onCancel={() => setQuickEditId(null)}
                    onSuccess={handleQuickEditSuccess}
                    page={page}
                    parentPages={parentPages}
                  />
                ) : (
                  <PageRowItem
                    basePath={basePath}
                    isSelected={selectedIds.includes(page.id)}
                    key={page.id}
                    onQuickEdit={() => setQuickEditId(page.id)}
                    onToggleSelect={(checked) => toggleSelectOne(page.id, checked)}
                    onTrash={() => handleRowTrash(page.id)}
                    page={page}
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
                  aria-label="Select all pages bottom"
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 font-semibold">Title</th>
              <th className="px-3 py-2 font-semibold">Author</th>
              <th className="px-3 py-2 text-center font-semibold">
                <MessageSquare className="inline size-3.5 fill-[#72777c] text-transparent" />
              </th>
              <th className="px-3 py-2 font-semibold">Date</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Tablenav */}
      <PageTablenav
        basePath={basePath}
        bulkAction={bulkAction}
        currentPage={pagination?.currentPage}
        isPending={isPending}
        onApplyBulkAction={handleApplyBulkAction}
        onBulkActionChange={setBulkAction}
        position="bottom"
        queryString={pagination?.queryString}
        totalItems={pagination?.totalItems ?? pages.length}
        totalPages={pagination?.totalPages}
      />
    </div>
  );
}
