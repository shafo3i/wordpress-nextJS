"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getPostDateBounds } from "@/lib/post-date-filter";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export type CategoryOption = {
  id: string;
  slug: string;
  name: string;
};

export function PostTablenav({
  position = "top",
  bulkAction,
  onBulkActionChange,
  onApplyBulkAction,
  isPending = false,
  isTrashView = false,
  canDelete = true,
  categories = [],
  currentCategory,
  currentDate,
  dateMonths = [],
  currentFrom,
  currentTo,
  totalItems = 0,
  currentPage = 1,
  totalPages = 1,
  basePath = "/admincp/posts",
  queryString = "",
  dict = {},
  direction = "ltr",
}: {
  position?: "top" | "bottom";
  bulkAction: string;
  onBulkActionChange: (action: string) => void;
  onApplyBulkAction: () => void;
  isPending?: boolean;
  isTrashView?: boolean;
  canDelete?: boolean;
  categories?: CategoryOption[];
  currentCategory?: string;
  currentDate?: string;
  dateMonths?: string[];
  currentFrom?: string;
  currentTo?: string;
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
  queryString?: string;
  dict?: Record<string, string>;
  direction?: "rtl" | "ltr";
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(currentCategory ?? "all");
  const [selectedDate, setSelectedDate] = useState(currentDate ?? "all");
  const [from, setFrom] = useState(currentFrom || "");
  const [to, setTo] = useState(currentTo || "");
  const validDates = getPostDateBounds({ date: selectedDate, from: selectedDate === "range" ? from : undefined, to: selectedDate === "range" ? to : undefined }).valid;
  const months = [...new Set([...(currentDate && /^[1-9]\d{3}-\d{2}$/.test(currentDate) ? [currentDate] : []), ...dateMonths])].filter(month => getPostDateBounds({ date: month }).valid).sort().reverse();

  const buildHref = (pageNumber: number) => {
    const params = new URLSearchParams(queryString);
    params.set("page", String(pageNumber));
    const suffix = params.toString();
    return `${basePath}${suffix ? `?${suffix}` : ""}`;
  };

  const handleFilter = () => {
    const params = new URLSearchParams(queryString);
    if (selectedCategory && selectedCategory !== "all") {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }
    if (selectedDate && selectedDate !== "all") {
      params.set("date", selectedDate);
    } else {
      params.delete("date");
    }
    params.delete("page");
    params.delete("from"); params.delete("to");
    if (selectedDate === "range") {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    }
    const suffix = params.toString();
    router.push(`${basePath}${suffix ? `?${suffix}` : ""}`);
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#50575e] ${
        position === "top" ? "mb-2" : "mt-3"
      } text-start`}
      dir={direction}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {canDelete && <><select
          aria-label={dict["admin.common.bulk_actions"] || "Bulk actions"}
          className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
          onChange={(e) => onBulkActionChange(e.target.value)}
          value={bulkAction}
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
          className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-50"
          disabled={isPending || bulkAction === "Bulk actions"}
          onClick={onApplyBulkAction}
          type="button"
        >
          {isPending
            ? dict["admin.common.applying"] || "Applying..."
            : dict["admin.common.apply"] || "Apply"}
        </button></>}

        {position === "top" && (
          <>
            <select
              aria-label={dict["admin.common.filter_by_date"] || "Filter by date"}
              className="ms-2 h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              onChange={(e) => setSelectedDate(e.target.value)}
              value={selectedDate}
            >
              <option value="all">{dict["admin.common.all_dates"] || "All dates"}</option>
              {currentDate === "today" && <option value="today">{dict["admin.common.today"]}</option>}
              {currentDate === "month" && <option value="month">{dict["admin.common.this_month"]}</option>}
              {months.map(month => <option key={month} value={month}>{new Intl.DateTimeFormat(direction === "rtl" ? "ar" : "en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`))}</option>)}
              <option value="range">{dict["admin.posts.custom_date_range"]}</option>
            </select>
            {selectedDate === "range" && <>
              <label className="flex items-center gap-1 text-xs">{dict["admin.posts.date_from"]}<input aria-label={dict["admin.posts.date_from"]} type="date" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} className="h-[30px] border border-[#8c8f94] bg-white px-2" /></label>
              <label className="flex items-center gap-1 text-xs">{dict["admin.posts.date_to"]}<input aria-label={dict["admin.posts.date_to"]} type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} className="h-[30px] border border-[#8c8f94] bg-white px-2" /></label>
              {!validDates && <span role="alert" className="text-xs text-[#d63638]">{dict["admin.posts.invalid_date_range"]}</span>}
            </>}

            <select
              aria-label={dict["admin.posts.all_categories"] || "Filter by category"}
              className="h-[30px] rounded-[3px] border border-[#8c8f94] bg-white px-2 py-1 text-[13px] text-[#2c3338] shadow-[0_1px_2px_rgba(0,0,0,0.07)_inset] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              onChange={(e) => setSelectedCategory(e.target.value)}
              value={selectedCategory}
            >
              <option value="all">
                {dict["admin.posts.all_categories"] || "All Categories"}
              </option>
              {categories.map((category) => (
                <option key={category.id || category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              className="h-[30px] rounded-[3px] border border-[#2271b1] bg-[#f6f7f7] px-3 text-[13px] font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78]"
              onClick={handleFilter}
              disabled={!validDates}
              type="button"
            >
              {dict["admin.common.filter"] || "Filter"}
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#646970]">
          {totalItems} {dict["admin.pagination.items"] || "items"}
        </span>

        {totalPages >= 1 && (
          <div className="flex items-center gap-1">
            {/* First Page */}
            {currentPage > 1 ? (
              <Link
                aria-label={dict["admin.pagination.first"] || "First page"}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                href={buildHref(1)}
              >
                {direction === "rtl" ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
              </Link>
            ) : (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad] opacity-60">
                {direction === "rtl" ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
              </span>
            )}

            {/* Previous Page */}
            {currentPage > 1 ? (
              <Link
                aria-label={dict["admin.pagination.prev"] || "Previous page"}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                href={buildHref(currentPage - 1)}
              >
                {direction === "rtl" ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
              </Link>
            ) : (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad] opacity-60">
                {direction === "rtl" ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
              </span>
            )}

            {/* Current Page of Total */}
            <span className="px-1 text-[13px] text-[#646970]">
              <bdi>{currentPage} {dict["admin.pagination.of"] || "of"} {totalPages}</bdi>
            </span>

            {/* Next Page */}
            {currentPage < totalPages ? (
              <Link
                aria-label={dict["admin.pagination.next"] || "Next page"}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                href={buildHref(currentPage + 1)}
              >
                {direction === "rtl" ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </Link>
            ) : (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad] opacity-60">
                {direction === "rtl" ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </span>
            )}

            {/* Last Page */}
            {currentPage < totalPages ? (
              <Link
                aria-label={dict["admin.pagination.last"] || "Last page"}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] hover:border-[#8c8f94] hover:bg-[#f0f0f1]"
                href={buildHref(totalPages)}
              >
                {direction === "rtl" ? <ChevronsLeft className="size-3.5" /> : <ChevronsRight className="size-3.5" />}
              </Link>
            ) : (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[3px] border border-[#dcdcde] bg-[#f6f7f7] text-[#a7aaad] opacity-60">
                {direction === "rtl" ? <ChevronsLeft className="size-3.5" /> : <ChevronsRight className="size-3.5" />}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
