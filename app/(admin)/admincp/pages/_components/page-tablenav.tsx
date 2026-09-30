"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function PageTablenav({
  position,
  bulkAction,
  onBulkActionChange,
  onApplyBulkAction,
  isPending,
  isTrashView,
  currentDate,
  pagination,
  selectedCount,
  dict = {},
  direction = "ltr",
}: {
  position: "top" | "bottom";
  bulkAction: string;
  onBulkActionChange: (action: string) => void;
  onApplyBulkAction: () => void;
  isPending: boolean;
  isTrashView?: boolean;
  currentDate?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    queryString?: string;
  };
  selectedCount?: number;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(currentDate || "all");

  const currentPage = pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;

  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams(pagination?.queryString || "");
    params.set("page", targetPage.toString());
    return `/admincp/pages?${params.toString()}`;
  };

  const handleFilterDate = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (selectedDate && selectedDate !== "all") {
      params.set("date", selectedDate);
    } else {
      params.delete("date");
    }
    router.push(`/admincp/pages?${params.toString()}`);
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-[13px] ${
        position === "top" ? "mb-2" : "mt-2"
      } text-start`}
      dir={direction}
    >
      {/* Bulk actions and Date filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          value={bulkAction}
          onChange={(e) => onBulkActionChange(e.target.value)}
          aria-label={dict["admin.common.bulk_actions"] || "Bulk actions"}
          className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
        >
          <option value="Bulk actions">
            {dict["admin.common.bulk_actions"] || "Bulk actions"}
          </option>
          {!isTrashView ? (
            <option value="Move to Trash">
              {dict["admin.comments.bulk.trash"] || "Move to Trash"}
            </option>
          ) : (
            <>
              <option value="Restore">
                {dict["admin.comments.bulk.restore"] || "Restore"}
              </option>
              <option value="Delete permanently">
                {dict["admin.comments.bulk.delete"] || "Delete permanently"}
              </option>
            </>
          )}
        </select>
        <button
          type="button"
          disabled={isPending || bulkAction === "Bulk actions"}
          onClick={onApplyBulkAction}
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 font-medium text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-50"
        >
          {isPending
            ? dict["admin.common.applying"] || "Applying..."
            : dict["admin.common.apply"] || "Apply"}
        </button>

        {position === "top" && (
          <>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label={dict["admin.common.filter_by_date"] || "Filter by date"}
              className="ms-2 h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:outline-none"
            >
              <option value="all">{dict["admin.common.all_dates"] || "All dates"}</option>
              <option value="today">{dict["admin.common.today"] || "Today"}</option>
              <option value="month">{dict["admin.common.this_month"] || "This month"}</option>
            </select>
            <button
              type="button"
              onClick={handleFilterDate}
              className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
            >
              {dict["admin.common.filter"] || "Filter"}
            </button>
          </>
        )}
      </div>

      {/* Pagination & stats: ALWAYS VISIBLE */}
      <div className="flex items-center gap-3">
        <span className="text-[#646970] text-[13px]">
          {totalItems} {dict["admin.pagination.items"] || "items"}
        </span>

        <div className="flex items-center gap-1">
          <span className="text-[13px] text-[#646970] me-1">
            {currentPage} {dict["admin.pagination.of"] || "of"} {totalPages}
          </span>

          {currentPage > 1 ? (
            <Link
              href={buildPageUrl(1)}
              className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
              title={dict["admin.pagination.first"] || "First Page"}
            >
              {direction === "rtl" ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
            </Link>
          ) : (
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#c3c4c7]">
              {direction === "rtl" ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
            </span>
          )}

          {currentPage > 1 ? (
            <Link
              href={buildPageUrl(currentPage - 1)}
              className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
              title={dict["admin.pagination.prev"] || "Previous Page"}
            >
              {direction === "rtl" ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
            </Link>
          ) : (
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#c3c4c7]">
              {direction === "rtl" ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
            </span>
          )}

          {currentPage < totalPages ? (
            <Link
              href={buildPageUrl(currentPage + 1)}
              className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
              title={dict["admin.pagination.next"] || "Next Page"}
            >
              {direction === "rtl" ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </Link>
          ) : (
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#c3c4c7]">
              {direction === "rtl" ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </span>
          )}

          {currentPage < totalPages ? (
            <Link
              href={buildPageUrl(totalPages)}
              className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
              title={dict["admin.pagination.last"] || "Last Page"}
            >
              {direction === "rtl" ? <ChevronsLeft className="size-3.5" /> : <ChevronsRight className="size-3.5" />}
            </Link>
          ) : (
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#c3c4c7]">
              {direction === "rtl" ? <ChevronsLeft className="size-3.5" /> : <ChevronsRight className="size-3.5" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
