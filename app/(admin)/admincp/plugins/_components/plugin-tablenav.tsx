"use client";

import Link from "next/link";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export function PluginTablenav({
  position = "top",
  bulkAction,
  onBulkActionChange,
  onApplyBulkAction,
  isPending = false,
  totalItems = 0,
  currentPage = 1,
  totalPages = 1,
  basePath = "/admincp/plugins",
  queryString = "",
  dict = {},
}: {
  position?: "top" | "bottom";
  bulkAction: string;
  onBulkActionChange: (action: string) => void;
  onApplyBulkAction: () => void;
  isPending?: boolean;
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
  queryString?: string;
  dict?: Record<string, string>;
}) {
  const validTotalPages = Math.max(1, totalPages);
  const validCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

  const buildHref = (pageNumber: number) => {
    const params = new URLSearchParams(queryString);
    params.set("page", String(pageNumber));
    const suffix = params.toString();
    return `${basePath}${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#50575e] ${
        position === "top" ? "mb-2" : "mt-3"
      }`}
    >
      {/* Left: Bulk Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`bulk-action-selector-${position}`}>
          {dict["admin.plugins.select_bulk_action"] || "Select bulk action"}
        </label>
        <select
          className="h-8 rounded border border-[#8c8f94] bg-white px-2 py-1 text-xs text-[#2c3338] shadow-sm focus:border-[#2271b1] focus:outline-none"
          disabled={isPending}
          id={`bulk-action-selector-${position}`}
          onChange={(e) => onBulkActionChange(e.target.value)}
          value={bulkAction}
        >
          <option value="Bulk actions">{dict["admin.common.bulk_actions"] || "Bulk actions"}</option>
          <option value="activate">{dict["admin.plugins.activate"] || "Activate"}</option>
          <option value="deactivate">{dict["admin.plugins.deactivate"] || "Deactivate"}</option>
          <option value="delete">{dict["admin.plugins.delete"] || "Delete"}</option>
        </select>
        <button
          className="h-8 rounded border border-[#2271b1] bg-[#f6f7f7] px-3 text-xs font-medium text-[#2271b1] hover:bg-[#f0f0f1] disabled:opacity-50 cursor-pointer"
          disabled={isPending || bulkAction === "Bulk actions"}
          onClick={onApplyBulkAction}
          type="button"
        >
          {isPending ? "..." : dict["admin.common.apply"] || "Apply"}
        </button>
      </div>

      {/* Right: Permanent Pagination Controls */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#646970]">
          {totalItems} {dict["admin.pagination.items"] || dict["admin.plugins.items"] || "items"}
        </span>

        <div className="flex items-center gap-1">
          <span className="mx-1 text-[13px] text-[#646970]">
            {validCurrentPage} {dict["admin.pagination.of"] || "of"} {validTotalPages}
          </span>

          {validCurrentPage > 1 ? (
            <Link
              aria-label="First page"
              className="inline-flex size-7 items-center justify-center border border-[#dcdcde] bg-[#f6f7f7] text-[#2c3338] hover:bg-[#f0f0f1]"
              href={buildHref(1)}
            >
              <ChevronsLeft className="size-3.5 rtl:rotate-180" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex size-7 items-center justify-center border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad] opacity-50 cursor-not-allowed"
            >
              <ChevronsLeft className="size-3.5 rtl:rotate-180" />
            </span>
          )}

          {validCurrentPage > 1 ? (
            <Link
              aria-label="Previous page"
              className="inline-flex size-7 items-center justify-center border border-[#dcdcde] bg-[#f6f7f7] text-[#2c3338] hover:bg-[#f0f0f1]"
              href={buildHref(validCurrentPage - 1)}
            >
              <ChevronLeft className="size-3.5 rtl:rotate-180" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex size-7 items-center justify-center border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad] opacity-50 cursor-not-allowed"
            >
              <ChevronLeft className="size-3.5 rtl:rotate-180" />
            </span>
          )}

          {validCurrentPage < validTotalPages ? (
            <Link
              aria-label="Next page"
              className="inline-flex size-7 items-center justify-center border border-[#dcdcde] bg-[#f6f7f7] text-[#2c3338] hover:bg-[#f0f0f1]"
              href={buildHref(validCurrentPage + 1)}
            >
              <ChevronRight className="size-3.5 rtl:rotate-180" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex size-7 items-center justify-center border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad] opacity-50 cursor-not-allowed"
            >
              <ChevronRight className="size-3.5 rtl:rotate-180" />
            </span>
          )}

          {validCurrentPage < validTotalPages ? (
            <Link
              aria-label="Last page"
              className="inline-flex size-7 items-center justify-center border border-[#dcdcde] bg-[#f6f7f7] text-[#2c3338] hover:bg-[#f0f0f1]"
              href={buildHref(validTotalPages)}
            >
              <ChevronsRight className="size-3.5 rtl:rotate-180" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex size-7 items-center justify-center border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad] opacity-50 cursor-not-allowed"
            >
              <ChevronsRight className="size-3.5 rtl:rotate-180" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
