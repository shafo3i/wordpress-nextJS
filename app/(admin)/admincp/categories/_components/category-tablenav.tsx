"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import type { SelectLanguage } from "@/db/schema/cms-languages";

export function CategoryTablenav({
  position = "top",
  bulkAction,
  onBulkActionChange,
  onApplyBulkAction,
  isPending = false,
  totalItems = 0,
  currentPage = 1,
  totalPages = 1,
  basePath = "/admincp/categories",
  queryString = "",
  hasSelected = false,
  languages = [],
  currentLanguage = "all",
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
  hasSelected?: boolean;
  languages?: SelectLanguage[];
  currentLanguage?: string;
  dict?: Record<string, string>;
}) {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState(currentLanguage ?? "all");

  const validTotalPages = Math.max(1, totalPages);
  const validCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

  const buildHref = (pageNumber: number) => {
    const params = new URLSearchParams(queryString);
    params.set("page", String(pageNumber));
    const suffix = params.toString();
    return `${basePath}${suffix ? `?${suffix}` : ""}`;
  };

  const handleFilter = () => {
    const params = new URLSearchParams(queryString);
    if (selectedLang && selectedLang !== "all") {
      params.set("lang", selectedLang);
    } else {
      params.delete("lang");
    }
    params.delete("page");
    const suffix = params.toString();
    router.push(`${basePath}${suffix ? `?${suffix}` : ""}`);
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
          {dict["admin.common.bulk_actions"] || "Bulk actions"}
        </label>
        <select
          className="h-8 rounded border border-[#8c8f94] bg-white px-2 py-1 text-xs text-[#2c3338] shadow-sm focus:border-[#2271b1] focus:outline-none"
          disabled={isPending}
          id={`bulk-action-selector-${position}`}
          onChange={(e) => onBulkActionChange(e.target.value)}
          value={bulkAction}
        >
          <option value="Bulk actions">{dict["admin.common.bulk_actions"] || "Bulk actions"}</option>
          <option value="delete">{dict["admin.categories.delete"] || "Delete"}</option>
        </select>
        <button
          className="h-8 rounded border border-[#2271b1] bg-[#f6f7f7] px-3 text-xs text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          disabled={isPending || bulkAction !== "delete" || !hasSelected}
          onClick={onApplyBulkAction}
          type="button"
        >
          {isPending
            ? dict["admin.common.applying"] || "Applying..."
            : dict["admin.common.apply"] || "Apply"}
        </button>

        {languages && languages.length > 0 && (
          <>
            <select
              aria-label={dict["admin.common.filter_by_language"] || "Filter by language"}
              className="h-8 rounded border border-[#8c8f94] bg-white px-2 py-1 text-xs text-[#2c3338] shadow-sm focus:border-[#2271b1] focus:outline-none"
              onChange={(e) => setSelectedLang(e.target.value)}
              value={selectedLang}
            >
              <option value="all">
                {dict["admin.common.all_languages"] || "All languages"}
              </option>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName ? `${l.name} (${l.nativeName})` : l.name}
                </option>
              ))}
            </select>

            <button
              className="h-8 rounded border border-[#2271b1] bg-[#f6f7f7] px-3 text-xs font-normal text-[#2271b1] hover:border-[#0a4b78] hover:bg-[#f0f0f1] hover:text-[#0a4b78] cursor-pointer"
              onClick={handleFilter}
              type="button"
            >
              {dict["admin.common.filter"] || "Filter"}
            </button>
          </>
        )}
      </div>

      {/* Right: Authentic WP Pagination Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#646970]">
          {totalItems} {dict["admin.pagination.items"] || "items"}
        </span>

        <div className="flex items-center gap-1">
          <span className="mx-1 text-xs text-[#646970]">
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
