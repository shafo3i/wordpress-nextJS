import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type Props = {
  position?: "top" | "bottom";
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  currentStatus?: string;
  searchQuery?: string;
  basePath?: string;
  dict?: Record<string, string>;
};

export function PluginPagination({
  position = "top",
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  currentStatus = "all",
  searchQuery = "",
  basePath = "/admincp/plugins",
  dict = {},
}: Props) {
  const validTotalPages = Math.max(1, totalPages);
  const validCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

  const buildHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (currentStatus && currentStatus !== "all") {
      params.set("status", currentStatus);
    }
    if (searchQuery && searchQuery.trim().length > 0) {
      params.set("s", searchQuery.trim());
    }
    params.set("page", String(pageNumber));
    const suffix = params.toString();
    return `${basePath}${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 text-[13px] text-[#50575e] ${
        position === "top" ? "mb-2" : "mt-3"
      }`}
    >
      <div className="flex items-center gap-1.5" />

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#646970]">
          {totalItems} {dict["admin.pagination.items"] || "items"}
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
