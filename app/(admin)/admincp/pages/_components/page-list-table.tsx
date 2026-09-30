"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, MessageSquare } from "lucide-react";
import {
  deletePagesPermanentlyAction,
  movePagesToTrashAction,
  restorePagesAction,
} from "../action";
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
  languages = [],
  isTrashView = false,
  dict = {},
  direction = "ltr",
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
  languages?: { code: string; name: string; nativeName?: string }[];
  isTrashView?: boolean;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const [pages, setPages] = useState<PageRowData[]>(initialPages);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("Bulk actions");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync state if initialPages change and not editing
  if (initialPages !== pages && !quickEditId) {
    setPages(initialPages);
  }

  const allSelected = pages.length > 0 && selectedIds.length === pages.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? pages.map((p) => p.id) : []);
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((curr) =>
      checked ? [...new Set([...curr, id])] : curr.filter((i) => i !== id)
    );
  };

  const handleApplyBulkAction = () => {
    if (!selectedIds.length || bulkAction === "Bulk actions") return;

    startTransition(async () => {
      if (bulkAction === "Move to Trash") {
        const res = await movePagesToTrashAction(selectedIds);
        if (res.success) {
          setNotice({
            type: "success",
            message: `${selectedIds.length} ${dict["admin.pages.moved_to_trash"] || "page(s) moved to Trash."}`,
          });
        } else {
          setNotice({ type: "error", message: res.error || "Failed to move pages to Trash." });
        }
      } else if (bulkAction === "Restore") {
        const res = await restorePagesAction(selectedIds);
        if (res.success) {
          setNotice({
            type: "success",
            message: `${selectedIds.length} ${dict["admin.pages.restored"] || "page(s) restored."}`,
          });
        } else {
          setNotice({ type: "error", message: res.error || "Failed to restore pages." });
        }
      } else if (bulkAction === "Delete permanently") {
        const res = await deletePagesPermanentlyAction(selectedIds);
        if (res.success) {
          setNotice({
            type: "success",
            message: `${selectedIds.length} ${dict["admin.pages.permanently_deleted"] || "page(s) permanently deleted."}`,
          });
        } else {
          setNotice({ type: "error", message: res.error || "Failed to delete pages." });
        }
      }
      setSelectedIds([]);
      setBulkAction("Bulk actions");
      router.refresh();
    });
  };

  const handleRowTrash = (pageId: string) => {
    startTransition(async () => {
      const res = await movePagesToTrashAction([pageId]);
      if (res.success) {
        setNotice({
          type: "success",
          message: dict["admin.pages.single_moved_to_trash"] || "1 page moved to Trash.",
        });
      } else {
        setNotice({ type: "error", message: res.error || "Failed to move page to Trash." });
      }
      router.refresh();
    });
  };

  const handleRowRestore = (pageId: string) => {
    startTransition(async () => {
      const res = await restorePagesAction([pageId]);
      if (res.success) {
        setNotice({
          type: "success",
          message: dict["admin.pages.single_restored"] || "1 page restored.",
        });
      } else {
        setNotice({ type: "error", message: res.error || "Failed to restore page." });
      }
      router.refresh();
    });
  };

  const handleRowDeletePermanently = (pageId: string) => {
    startTransition(async () => {
      const res = await deletePagesPermanentlyAction([pageId]);
      if (res.success) {
        setNotice({
          type: "success",
          message: dict["admin.pages.single_permanently_deleted"] || "1 page permanently deleted.",
        });
      } else {
        setNotice({ type: "error", message: res.error || "Failed to delete page." });
      }
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
      curr.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
    setQuickEditId(null);
    setNotice({
      type: "success",
      message: dict["admin.pages.updated_notice"] || "Page updated.",
    });
    router.refresh();
  };

  return (
    <div className="space-y-2 text-start" dir={direction}>
      {notice && (
        <div
          className={`flex items-center justify-between rounded-[3px] border-s-4 p-3 text-[13px] ${
            notice.type === "success"
              ? "border-[#00a32a] bg-[#f0f6fc] text-[#1d2327]"
              : "border-[#d63638] bg-[#fcf0f1] text-[#1d2327]"
          }`}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[16px] leading-none text-[#787c82] hover:text-[#d63638]"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Tablenav */}
      <PageTablenav
        position="top"
        bulkAction={bulkAction}
        onBulkActionChange={setBulkAction}
        onApplyBulkAction={handleApplyBulkAction}
        isPending={isPending}
        isTrashView={isTrashView}
        currentDate={currentDate}
        pagination={pagination}
        selectedCount={selectedIds.length}
        dict={dict}
        direction={direction}
      />

      {/* Table Container */}
      <div className="overflow-x-auto rounded-[3px] border border-[#c3c4c7] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        <table className="w-full border-collapse text-start text-[13px]">
          <thead>
            <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#2c3338]">
              <th className="w-8 px-3 py-2 text-center">
                <input
                  aria-label={dict["admin.common.select_all"] || "Select all pages"}
                  checked={allSelected}
                  className="h-4 w-4 rounded border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-3 py-2 text-start font-semibold">
                <span className="inline-flex items-center gap-1">
                  {dict["admin.pages.table.title"] || dict["admin.posts.form.title"] || "Title"}
                  <ArrowUpDown className="size-3 text-[#8c8f94]" />
                </span>
              </th>

              {languages.length > 0 && (
                <th className="px-3 py-2 text-start font-semibold">
                  {dict["admin.posts.form.language"] || "Languages"}
                </th>
              )}

              <th className="px-3 py-2 text-start font-semibold">
                {dict["admin.posts.table.author"] || "Author"}
              </th>

              <th className="px-3 py-2 text-center font-semibold">
                <MessageSquare className="inline size-3.5 fill-[#72777c] text-transparent" />
              </th>

              <th className="px-3 py-2 text-start font-semibold whitespace-nowrap">
                <span className="inline-flex items-center gap-1">
                  {dict["admin.posts.table.date"] || "Date"}
                  <ArrowUpDown className="size-3 text-[#8c8f94]" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pages.length ? (
              pages.map((p) =>
                quickEditId === p.id ? (
                  <PageQuickEditRow
                    key={p.id}
                    page={p}
                    parentPages={parentPages}
                    colSpan={languages.length > 0 ? 6 : 5}
                    onCancel={() => setQuickEditId(null)}
                    onSuccess={handleQuickEditSuccess}
                    dict={dict}
                    direction={direction}
                  />
                ) : (
                  <PageRowItem
                    key={p.id}
                    page={p}
                    isSelected={selectedIds.includes(p.id)}
                    onToggleSelect={(checked) => toggleSelectOne(p.id, checked)}
                    onQuickEdit={() => setQuickEditId(p.id)}
                    onTrash={() => handleRowTrash(p.id)}
                    onRestore={() => handleRowRestore(p.id)}
                    onDeletePermanently={() => handleRowDeletePermanently(p.id)}
                    basePath={basePath}
                    languages={languages}
                    dict={dict}
                    direction={direction}
                  />
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={languages.length > 0 ? 6 : 5}
                  className="p-8 text-center text-[#646970]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Tablenav */}
      <PageTablenav
        position="bottom"
        bulkAction={bulkAction}
        onBulkActionChange={setBulkAction}
        onApplyBulkAction={handleApplyBulkAction}
        isPending={isPending}
        isTrashView={isTrashView}
        currentDate={currentDate}
        pagination={pagination}
        selectedCount={selectedIds.length}
        dict={dict}
        direction={direction}
      />
    </div>
  );
}
